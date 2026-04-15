import { supabase } from "@/utils/supabaseClient";
import { Feedback } from "@/types";

/**
 * ============================================
 * 💬 FEEDBACK SERVICE - QUẢN LÝ FEEDBACK
 * ============================================
 */

export const feedbackService = {
  /**
   * Lấy tất cả feedback, sắp xếp theo createdat giảm dần (mới nhất lên đầu)
   */
  async getFeedbacks(): Promise<Feedback[]> {
    try {
      const { data, error, count } = await supabase
        .from("feedbacks")
        .select("id, customerid, displayname, content, is_visible, createdat", {
          count: "exact",
        })
        .order("createdat", { ascending: false });

      if (error) {
        console.error("❌ Supabase Error:", error);
        throw error;
      }
      console.log("✅ Success! Total feedbacks:", data?.length || 0);
      console.log("📊 Exact count from DB:", count);
      console.log("📋 Data:", data);
      return (data || []) as Feedback[];
    } catch (error) {
      console.error("❌ Error fetching feedbacks:", error);
      throw error;
    }
  },

  /**
   * Set giá trị is_visible trực tiếp (TRUE hoặc FALSE, không toggle)
   */
  async setVisibility(id: string, isVisible: boolean): Promise<void> {
    try {
      console.log(`🔄 Updating feedback ${id}: is_visible = ${isVisible}`);
      const { error } = await supabase
        .from("feedbacks")
        .update({ is_visible: isVisible })
        .eq("id", id);

      if (error) {
        console.error("❌ Update Error:", error);
        throw error;
      }
      console.log("✅ Update Success!");
    } catch (error) {
      console.error("❌ Error setting visibility:", error);
      throw error;
    }
  },

  /**
   * Xóa feedback
   */
  async deleteFeedback(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("feedbacks").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("❌ Error deleting feedback:", error);
      throw error;
    }
  },
};
