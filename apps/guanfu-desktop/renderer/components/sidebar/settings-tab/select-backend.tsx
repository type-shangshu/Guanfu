import { BACKENDS, BackendId } from "@common/backends";

interface IProps {
  backendId: BackendId;
  setBackendId: (backendId: BackendId) => void;
}

export function SelectBackend({ backendId, setBackendId }: IProps) {
  return (
    <div className="flex flex-col gap-2 text-sm font-medium uppercase">
      <p>Backend</p>
      <select
        className="select select-bordered w-full rounded-btn bg-base-200 text-base-content"
        value={backendId}
        onChange={(event) => setBackendId(event.target.value as BackendId)}
      >
        {Object.entries(BACKENDS).map(([id, backend]) => (
          <option key={id} value={id}>
            {backend.label}
          </option>
        ))}
      </select>
      <p className="text-xs normal-case leading-normal text-base-content/70">
        {BACKENDS[backendId].description}
      </p>
    </div>
  );
}
