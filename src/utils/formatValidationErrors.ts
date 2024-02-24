import { ValidationError } from "@nestjs/common";

export const formatValidationErrors = (
	errors: ValidationError[],
	errMessage?: any,
	parentField?: string
): any => {
	const message = errMessage || {};
	let errorField:string = "";
	let validationList;

	errors.forEach((error) => {
		errorField = parentField ? `${parentField}.${error.property}` : error?.property;
		if (!error?.constraints && error?.children?.length) {
			formatValidationErrors(error.children, message, errorField);
		} else {
			validationList = Object.values(error?.constraints);
			message[errorField] = validationList.length > 0 ? validationList.pop() : "Invalid value";
		}
	});
	return message;
};
