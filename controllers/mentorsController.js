const supabase = require('../supabase.js');

exports.getMentorByID = async (id) => {
    const { data, error } = await supabase
        .from('Mentors')
        .select('*')
        .eq('mentor_id', id)
        .single();
    
    if (error) {
        console.error("Error fetching mentor:", error);
        return null;
    }
    return data;
};

/*exports.getMentors = async () => {
    const { data, error } = await supabase
        .from('Mentors')
        .select('*');
    
    if (error) {
        console.error("Error fetching mentors:", error);
        return [];
    }
    
    return data;
};*/