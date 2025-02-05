const supabase = require('../supabase.js');

exports.getPrograms = async () => {
  const { data, error } = await supabase.from('Programs').select('program_id, name');

  if (error) {
    console.error("Error fetching programs:", error);
    return [];
  }

  return [data.map(program => ({ text: program.name, callback_data: `program_${program.program_id}` }))];
};

exports.getProgramNameByID = async (programId) => {
  const { data, error } = await supabase
    .from('Programs')
    .select('name')
    .eq('program_id', programId)
    .single();

  if (error) {
    console.error("Error fetching program name:", error);
    return null; // Return null if there's an error
  }

  return data ? data.name : null;
};

