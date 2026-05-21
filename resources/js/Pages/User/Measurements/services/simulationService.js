const ranges = {
    heart_rate: { min: 72, max: 94, final: 78, secondary: 98 },
    temperature: { min: 36.2, max: 37.3, final: 36.6 },
    height: { min: 163, max: 167, final: 165 },
    weight: { min: 56, max: 60, final: 58 },
};

const randomBetween = (min, max) => Number((Math.random() * (max - min) + min).toFixed(1));

export function nextSimulatedReading(type, tick) {
    const range = ranges[type] || ranges.weight;
    const stabilizing = tick >= 8;

    return {
        value: stabilizing ? range.final : randomBetween(range.min, range.max),
        secondaryValue: type === "heart_rate"
            ? stabilizing ? range.secondary : Math.round(randomBetween(96, 99))
            : null,
        stabilized: stabilizing,
    };
}
