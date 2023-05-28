export const useUploadFile = (path: string, form: FormData, onUploadProgress: (event: ProgressEvent) => void, onUploadFinished: (result: any) => void) => {
	const xhr = new XMLHttpRequest();

	xhr.open('POST', `${useNuxtApp().$config.public.API_URL}${path}`);

	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4) {
			onUploadFinished(JSON.parse(xhr.response));
		}
	};

	xhr.upload.onprogress = onUploadProgress;

	xhr.send(form);
};
