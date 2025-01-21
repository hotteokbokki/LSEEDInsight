import { Box } from "@mui/material";
import Header from "../../components/Header";

const Scheduling = () => {
    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Header title="Scheduling Matrix" subtitle="Find the Appropriate Schedule" />
            </Box>
        </Box>
    );
};

export default Scheduling;
