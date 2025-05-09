exports.formatDate = (date) => {
    if (date === null) return null;
    return date.toISOString().split("T")[0];
};

exports.formatTime = (date) => {
    if (date === null) return null;
    return date.toISOString().split("T")[1].slice(0, 8);
};

exports.formatDateTime = (date) => {
    if (date === null) return null;
    return `${this.formatDate(date)} ${this.formatTime(date)}`;
};

exports.getCurrentDate = () =>{
    let today = new Date();
    let month = String(today.getMonth() + 1).padStart(2, '0');
    let day = String(today.getDate()).padStart(2, '0');
    let year = today.getFullYear();

    return `${month}/${day}/${year}`;
};