<![CDATA[
import React, { useEffect, useState } from 'react';

const SalarySlip = () => {
  const [payslips, setPayslips] = useState([]);

  useEffect(() => {
    const response = {
      "status": true,
      "data": [
        {
          "payslip_name": "Arun Payslip for Jan 2025.pdf",
          "month_year": "Jan - 2025",
          "folder_desc": "Payslip of the month Jan - 2025",
          "payslip_link": "#" // Replace with actual link
        },
        {
          "payslip_name": "Arun Payslip for Feb 2025.pdf",
          "month_year": "Feb - 2025",
          "folder_desc": "Payslip of the month Feb - 2025",
          "payslip_link": "#" // Replace with actual link
        }
      ]
    };

    if (response.status) {
      setPayslips(response.data);
    } else {
      // Handle error
      setPayslips([]);
    }
  }, []);

  return (
    <div>
      <h2>Payslip Download</h2>
      <table>
        <thead>
          <tr>
            <th>Month & Year</th>
            <th>Download</th>
          </tr>
        </thead>
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="2">Error fetching payslips. Please try again later.</td></tr>`;
    }
  </script>
</div>
]]>
