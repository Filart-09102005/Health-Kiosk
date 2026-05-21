export function calculateBMI(height, weight) {
    if (! height) return { value: null, message: "Please complete height measurement" };
    if (! weight) return { value: null, message: "Please complete weight measurement" };

    const meters = Number(height) / 100;
    const value = Number((Number(weight) / (meters * meters)).toFixed(2));

    return {
        value,
        category: value < 18.5 ? "Underweight" : value < 25 ? "Normal" : value < 30 ? "Overweight" : "Obese",
        message: null,
    };
}
