import LeaveComponent from "../components/Leave/LeaveComponent";
import SalarySlipComponent from "../components/SalarySlip/SalarySlipComponent";

const intentsToComponents = {
  "apply_leave": LeaveComponent,
  "leave_balance": LeaveComponent,
  "cancel_leave": LeaveComponent,
  "leave_history": LeaveComponent,
  "salary_slip": SalarySlipComponent
};

export default intentsToComponents;
