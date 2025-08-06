import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { webhookUrl, productData, storyImageData } = await req.json()

    if (!webhookUrl || !productData) {
      return new Response(
        JSON.stringify({ error: 'Webhook URL e dados do produto são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let storyImageUrl = ''

    // Upload story image to storage if provided
    if (storyImageData) {
      try {
        // Convert base64 to blob
        const base64Data = storyImageData.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        
        // Generate unique filename
        const timestamp = new Date().getTime()
        const filename = `story-${timestamp}-${Math.random().toString(36).substring(7)}.jpg`
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('story-images')
          .upload(filename, byteArray, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          })

        if (uploadError) {
          console.error('Erro ao fazer upload da imagem story:', uploadError)
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('story-images')
            .getPublicUrl(filename)
          
          storyImageUrl = publicUrl
          console.log('Story image uploaded successfully:', storyImageUrl)
        }
      } catch (error) {
        console.error('Erro ao processar imagem story:', error)
      }
    }

    // Prepare data to send to webhook
    const dataToSend = {
      nome: productData.nome,
      preco_regular: productData.preco_regular,
      preco_oferta: productData.preco_oferta,
      descricao: productData.descricao,
      categoria: productData.categoria,
      imagem_feed: productData.imagem, // Feed format as base64
      imagem_story: storyImageUrl, // Story format as URL
      timestamp: new Date().toISOString()
    }

    console.log('Enviando dados para webhook:', webhookUrl)
    console.log('Dados:', dataToSend)

    // Send POST request to webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend)
    })

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error(`Webhook erro ${webhookResponse.status}:`, errorText)
      
      let errorMessage = `Webhook retornou status ${webhookResponse.status}`
      if (webhookResponse.status === 404) {
        errorMessage = 'URL do webhook não encontrada (404). Verifique se o URL está correto no cadastro do cliente.'
      } else if (webhookResponse.status === 401 || webhookResponse.status === 403) {
        errorMessage = 'Acesso negado ao webhook. Verifique as permissões.'
      } else if (webhookResponse.status >= 500) {
        errorMessage = 'Erro interno no servidor do webhook. Tente novamente mais tarde.'
      }
      
      throw new Error(errorMessage)
    }

    const result = await webhookResponse.text()
    console.log('Resposta do webhook:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Produto enviado para grupo de oferta com sucesso!',
        webhookStatus: webhookResponse.status
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro ao enviar para webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao enviar produto para grupo de oferta',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})