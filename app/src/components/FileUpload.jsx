export default function FileUpload({ onFilesChange }) {
  return (
    <input
      type="file"
      multiple
      onChange={(event) => onFilesChange(Array.from(event.target.files || []))}
    />
  );
}
