/** Convert File objects to base64 data URLs for storage/display (mock & API body). */
export const filesToDataUrls = (files) =>
    Promise.all(
        files.map(
            (file) =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                })
        )
    );
