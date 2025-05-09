exports.analyzeAttendance = (records, startDate = null, endDate = null) => {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Set default startDate and endDate
    let start = startDate ? new Date(startDate) : firstDayOfMonth;
    let end = endDate ? new Date(endDate) : lastDayOfMonth;

    let totalSummary = {
        total_employees: new Set(),  // To track unique employees
        total_workdays: 0,
        fromDate: start.toISOString().split('T')[0],
        toDate: end.toISOString().split('T')[0],
        on_time: 0,
        late: 0,
        absent: 0,
        overall_rate: 0
    };

    let empDates = new Map(); // Track employee attendance by date

    // Count valid workdays (excluding Sundays)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0) { 
            totalSummary.total_workdays++;
        }
    }

    records.forEach(record => {
        const { emp_id, status, date } = record;
        const recordDate = new Date(date);

        if (recordDate < start || recordDate > end) return;

        totalSummary.total_employees.add(emp_id);

        if (!empDates.has(date)) {
            empDates.set(date, new Set());
        }
        empDates.get(date).add(emp_id);

        if (status == "2") {
            totalSummary.on_time++;
        } else if (status == "1") {
            totalSummary.late++;
        }
    });

    let totalAbsent = 0;
    totalSummary.total_employees.forEach(emp_id => {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (d.getDay() !== 0) { 
                const formattedDate = d.toISOString().split('T')[0];
                if (!empDates.has(formattedDate) || !empDates.get(formattedDate).has(emp_id)) {
                    totalAbsent++;
                }
            }
        }
    });

    totalSummary.absent = totalAbsent;
    let totalRecordedDays = totalSummary.on_time + totalSummary.late + totalSummary.absent;
    totalSummary.overall_rate = totalRecordedDays > 0 ? Number(((totalSummary.on_time / totalRecordedDays) * 100).toFixed(2)) : 0;

    totalSummary.total_employees = totalSummary.total_employees.size; // Convert Set to count

    return totalSummary;
};
