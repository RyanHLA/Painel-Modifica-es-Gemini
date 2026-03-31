import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "npm:@aws-sdk/client-s3@3.450.0"
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.450.0"
import { createClient } from "npm:@supabase/supabase-js@2"

const ALLOWED_ORIGIN = Deno.env.get('ADMIN_ORIGIN') ?? 'http://localhost:8081'
const R2_PUBLIC_URL  = Deno.env.get('R2_PUBLIC_URL') ?? ''

const getCorsHeaders = (requestOrigin: string) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN && requestOrigin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
})

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Remove caracteres perigosos do nome do arquivo
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/\.{2,}/g, '-')
}

serve(async (req) => {
  const origin = req.headers.get('origin') ?? ''
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    // 1. Cliente com JWT do usuário (respeita RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 2. Valida sessão
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    // 3. Busca fotógrafo — substitui a verificação antiga de user_roles
    const { data: photographer, error: pgErr } = await supabase
      .from('photographers')
      .select('id, account_status, trial_ends_at')
      .eq('user_id', user.id)
      .single()

    if (pgErr || !photographer) throw new Error('Photographer not found')

    // 4. Verifica account_status (bloqueia suspensos e trials vencidos)
    if (photographer.account_status === 'suspended') {
      throw new Error('ACCOUNT_SUSPENDED: Reative sua assinatura para continuar.')
    }
    if (
      photographer.account_status === 'trial' &&
      new Date(photographer.trial_ends_at) < new Date()
    ) {
      throw new Error('TRIAL_EXPIRED: Seu período de teste encerrou.')
    }

    const body = await req.json()
    const { action, fileType, fileSize, folder, filename } = body

    // 5. Configuração R2
    const s3 = new S3Client({
      region: 'auto',
      endpoint: Deno.env.get('R2_ENDPOINT'),
      credentials: {
        accessKeyId:     Deno.env.get('R2_ACCESS_KEY_ID')!,
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
      },
    })
    const bucketName = Deno.env.get('R2_BUCKET_NAME')

    // --- AÇÃO: UPLOAD ---
    if (action === 'upload') {
      if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType)) {
        throw new Error(`Tipo de arquivo não permitido (${fileType}).`)
      }
      if (fileSize && fileSize > MAX_FILE_SIZE) {
        throw new Error(`Arquivo muito grande. Limite: ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
      }
      if (!folder || !filename) {
        throw new Error('Missing required fields: folder, filename')
      }

      // 6. Verifica quota de storage antes de gerar a URL
      const { error: quotaErr } = await supabase.rpc('check_storage_quota', {
        p_photographer_id: photographer.id,
        p_file_size_bytes: fileSize ?? 0,
      })
      if (quotaErr) throw new Error(quotaErr.message)

      // 7. Gera key com prefixo do tenant — isola arquivos por fotógrafo
      const safeFilename = sanitizeFilename(filename)
      const key = `${photographer.id}/${folder}/${Date.now()}-${safeFilename}`

      const command = new PutObjectCommand({
        Bucket:       bucketName,
        Key:          key,
        ContentType:  fileType,
        CacheControl: 'public, max-age=31536000, immutable',
      })

      // Pre-signed URL expira em 5 minutos
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
      const publicUrl = `${R2_PUBLIC_URL}/${key}`

      return new Response(JSON.stringify({ uploadUrl, publicUrl, key }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // --- AÇÃO: DELETE ---
    if (action === 'delete') {
      const { key } = body
      if (!key) throw new Error('Missing required field: key')

      // 8. Valida ownership pelo prefixo — nunca confiar no key do frontend
      if (!key.startsWith(`${photographer.id}/`)) {
        console.error(`[FORBIDDEN] ${user.email} tentou deletar key de outro fotógrafo: ${key}`)
        throw new Error('Forbidden: Cannot delete another photographer\'s files.')
      }

      await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }))

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('[upload-url2]', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }
    })
  }
})
