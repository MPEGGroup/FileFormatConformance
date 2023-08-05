function stripSpecialChars(value: string) {
    return value.replace(/[="]/g, "");
}

export default stripSpecialChars;
