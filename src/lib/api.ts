import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function getFileDownloadUrl(fileId: string) {
  const response = await api.get(`/files/${fileId}/download`);
  return response.data.url;
}

export async function getFileMetadata(fileId: string) {
  const response = await api.get(`/files/${fileId}`);
  return response.data;
}
