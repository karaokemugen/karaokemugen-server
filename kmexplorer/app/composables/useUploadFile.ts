export const useUploadFile = (
	path: string,
	form: FormData,
	onUploadProgress: (event: ProgressEvent) => void,
	onUploadFinished: (result: any) => void,
	onUploadError: (result: any) => void,
) => {
	const xhr = new XMLHttpRequest();

	xhr.open('POST', `${useRequestURL().origin}${path}`);

	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4) {
			const response = JSON.parse(xhr.response);
			if (xhr.status === 200) {
				onUploadFinished(response);
			} else if (response.code) {
				onUploadError(response.code);
			}
		}
	};

	xhr.upload.onprogress = onUploadProgress;

	xhr.send(form);
};
