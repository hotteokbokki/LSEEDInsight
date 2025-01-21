import { Box } from "@mui/material";
import Header from "../../components/Header";

const Mentors = () => {
    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Header title="Mentors" subtitle="Explore LSEED Mentors" />
            </Box>
        </Box>
    );
};

export default Mentors;
