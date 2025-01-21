import { Box } from "@mui/material";
import Header from "../../components/Header";

const Reports = () => {
    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Header title="Reports" subtitle="Generate Reports" />
            </Box>
        </Box>
    );
};

export default Reports;
