exports.calculateHourlyRate = (baseSalary) => baseSalary / 160;

//ពន្ធលើប្រាក់បៀវត្ស​ = ( ប្រាក់មូលដ្ខានគិតពន្ធ * អត្រា​ពន្ធលើប្រាក់បៀវត្ស )​ - គម្លាតលើសនៃប្រាក់ពន្ធតាមថ្នាក់នីមួយៗ (មិនគិតបុគ្គលិកមានសហព័ទ្ធ​ ឬ កូនក្នុងបន្ទុក)
exports.calculateTax = (salary) => {
    let TAX_RATE, TAX_SPACE;
    
    if (salary < 325){ 
        TAX_RATE = 0;
        TAX_SPACE = 0;
    }
    else if (salary >= 325 && salary < 500) {                                           // គម្លាត $18.7
        TAX_RATE = 0.5;
        TAX_SPACE = 18.7;
    }
    else if (salary >= 500 && salary < 2125){                                           // គម្លាត $43.75
        TAX_RATE = 0.10;
        TAX_SPACE = 43.75;
    }
    else if(salary >= 2125 && salary <3125){
        TAX_RATE = 0.15;
        TAX_SPACE = 150;                                                               // គម្លាត $150 
    }
    else{
        TAX_RATE = 0.20;                                                                // គម្លាត $306.25
        TAX_SPACE = 306.25;
    }
    return (TAX_RATE * salary) - TAX_SPACE;
};

exports.calculateOvertimeRate = (date) => {
    const OVERTIME_RATE_NORMAL = 1.5;
    const OVERTIME_RATE_HOLIDAY = 2.0;
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    return (dayName === "Saturday" || dayName === "Sunday") ? OVERTIME_RATE_HOLIDAY : OVERTIME_RATE_NORMAL;
};

exports.getFirstDayOfMonth = (dateString) => {
    let date = new Date(dateString); 
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 2);
    return firstDay.toISOString().split('T')[0];
}

exports.getLastDayOfMonth = (dateString) => {
    let date = new Date(dateString);
    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return lastDay.toISOString().split('T')[0];
};