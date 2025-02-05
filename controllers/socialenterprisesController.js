const supabase = require('../supabase.js');

exports.getSocialEnterprisesByProgram = async (id) => {
    // Fetch available Social Enterprises from Supabase (you'll need to implement this)
    const { data, error } = await supabase.from('SocialEnterprises').select('*').eq('program_id', id);
    if (error) {
      console.error("Error fetching Social Enterprises:", error);
      return [];
    }
    return data.map(se => ({ text: se.teamName, callback_data: `se_${se.se_id}` }));
};
  
// exports.getSocialEnterpriseByProgram = async (id) => {
//     // Fetch a specific Social Enterprise by ID
//     const { data, error } = await supabase.from('SocialEnterprises').select('*').eq('program_id', id);
//     if (error) {
//       console.error("Error fetching Social Enterprise by ID:", error);
//       return null;
//     }
//     return data;
//   }