export function matchesNativeId(value, rule) {
    return rule.pattern.test(value) && (rule.validate?.(value) ?? true);
}
export function numericNativeId(value) {
    if (typeof value === "number" && !Number.isSafeInteger(value)) {
        return undefined;
    }
    return value.toString();
}
//# sourceMappingURL=native-ids.js.map