import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 1. Bộ lọc kết quả AI: Thông minh hơn, bắt được nhiều trường hợp
function cleanSentiment(text: string): string {
  const t = text.toLowerCase().trim();
  if (t.includes('tích cực') || t.includes('positive') || t.includes('ngon') || t.includes('tuyệt') || t.includes('tốt')) return 'Tích cực';
  if (t.includes('tiêu cực') || t.includes('negative') || t.includes('tệ') || t.includes('kém') || t.includes('dở')) return 'Tiêu cực';
  if (t.includes('spam')) return 'Spam';
  return 'Trung lập';
}

// 2. Logic "Cứng": Xử lý ngay các trường hợp hiển nhiên để tăng tốc và chính xác
function applyHybridLogic(rating: any, content: string): string | null {
  const r = Number(rating);
  const c = (content || "").trim().toLowerCase();
  
  // Từ khóa tích cực mạnh - có những từ này + 4-5 sao thì không cần hỏi AI
  const positiveKeywords = ['ngon', 'tuyệt', 'tốt', 'nhanh', 'hài lòng', 'ưng', 'đẹp', 'ok', 'oke', 'được', 'yét', '10 điểm', 'đã'];

  // Rule 1: 1-2 sao -> Chắc chắn Tiêu cực
  if (r > 0 && r <= 2) return 'Tiêu cực';

  // Rule 2: 4-5 sao + (nội dung ngắn HOẶC có từ khóa ngon/tốt...) -> Chắc chắn Tích cực
  if (r >= 4) {
    if (c.length < 15 || positiveKeywords.some(word => c.includes(word))) {
      return 'Tích cực';
    }
  }

  // Nếu không rơi vào các case trên mới dùng AI
  return null;
}

async function analyzeSentiment(text: string, apiKey: string): Promise<string> {
  if (!text || text.length < 2) return 'Tích cực';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Phân tích cảm xúc ngắn gọn: "${text}". Trả về duy nhất 1 từ: Tích cực, Tiêu cực, Trung lập hoặc Spam.` }] }],
        generationConfig: { temperature: 0.1 }
      })
    })
    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Trung lập';
    return cleanSentiment(result);
  } catch (e) {
    console.error("AI Error:", e);
    return 'Trung lập';
  }
}

serve(async (req) => {
  // Xử lý CORS cho trình duyệt
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const apiKey = Deno.env.get('GEMINI_API_KEY')!

    // Lấy 50 dòng chưa có sentiment hoặc đang là Trung lập để sửa lại
    const { data: reviews, error: fetchError } = await supabase
      .from('reviews')
      .select('reviewid, comment, rating')
      .or('sentiment.is.null, sentiment.eq.Trung lập')
      .limit(50);

    if (fetchError) throw fetchError;
    if (!reviews || reviews.length === 0) {
      return new Response(JSON.stringify({ message: "Đã sạch dữ liệu!" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- XỬ LÝ SONG SONG (PARALLEL) ---
    // Tạo danh sách các "lời hứa" xử lý cùng một lúc
    const processingPromises = reviews.map(async (item) => {
      let sentiment = applyHybridLogic(item.rating, item.comment);
      
      if (!sentiment) {
        sentiment = await analyzeSentiment(item.comment || '', apiKey);
      }

      // Cập nhật kết quả vào database
      return supabase
        .from('reviews')
        .update({ 
          sentiment: sentiment,
          is_visible: sentiment !== 'Spam' 
        })
        .eq('reviewid', item.reviewid);
    });

    // Chạy tất cả cùng lúc (Nhanh hơn gấp nhiều lần vòng lặp thường)
    await Promise.all(processingPromises);

    return new Response(JSON.stringify({ success: true, processed: reviews.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
})