const supabase = require('../supabase.js');

exports.getTelegramUsers = async (chatID) => {
    const { data, error } = await supabase
      .from('TelegramBot')
      .select('*')
      .eq('chatID', chatID)
      .single();
  
    if (error || !data) {
      console.error("Error fetching user:", error);
      return null; // Return null instead of an empty array for a single user
    }
  
    return data; // Return the user object directly
  };
  