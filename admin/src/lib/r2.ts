import { supabase } from "@/integrations/supabase/client";

export const r2Storage = {
  /**
   * Faz upload de um arquivo para o R2 via Edge Function upload-url2.
   *
   * A Edge Function é responsável por:
   *   - Verificar account_status e quota do fotógrafo
   *   - Gerar a key com prefixo do tenant ({photographer_id}/{folder}/...)
   *   - Retornar a pre-signed URL, a publicUrl e a key
   *
   * @returns { publicUrl, key } em caso de sucesso, null em caso de erro
   */
  upload: async (
    file: File,
    folder: string = 'gallery'
  ): Promise<{ publicUrl: string; key: string } | null> => {
    try {
      const { data, error: functionError } = await supabase.functions.invoke('upload-url2', {
        body: {
          action:   'upload',
          folder,
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
      })

      if (functionError) throw functionError
      if (!data?.uploadUrl) throw new Error('URL de upload não retornada pela função.')

      // Faz o PUT direto no R2 com a pre-signed URL
      const uploadResponse = await fetch(data.uploadUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadResponse.ok) {
        throw new Error(`Falha no upload para o R2: ${uploadResponse.statusText}`)
      }

      return { publicUrl: data.publicUrl, key: data.key }

    } catch (error) {
      console.error('[r2Storage.upload]', error)
      return null
    }
  },

  /**
   * Deleta um arquivo do R2 via Edge Function upload-url2.
   * Usa a key (ex: "{photographer_id}/gallery/...") em vez da URL pública.
   * A Edge Function valida que a key pertence ao fotógrafo logado.
   */
  delete: async (key: string): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('upload-url2', {
        body: { action: 'delete', key },
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('[r2Storage.delete]', error)
      return false
    }
  },
}
