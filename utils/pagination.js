const { query } = require('../config/db');

exports.Pagination = async (countSql, values = [], page = null, per_page = null) => {
    // Execute the count query
    const countResult = await query(countSql, values);
    const totalRecords = countResult?.[0]?.total || 0;

    // Set dynamic defaults for page and per_page
    per_page = per_page ? Math.max(parseInt(per_page), 1) : 10; // Default to 10 if not provided
    const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / per_page) : 1;

    page = page ? Math.max(parseInt(page), 1) : 1; // Default to 1 if not provided
    page = Math.min(page, totalPages); // Prevents requesting pages beyond the total

    return {
        total: totalRecords,
        pages: totalPages,
        page,
        per_page,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
};
