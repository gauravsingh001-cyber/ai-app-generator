import React, { useRef, useState } from 'react';
import { EntityType } from '../store/configStore';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Edit, Trash2, Plus, LayoutGrid } from 'lucide-react';
import api from '../lib/axios';

interface DynamicTableProps {
  entity: EntityType;
  data: any[];
  onAdd: () => void;
  onEdit: (record: any) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export const DynamicTable: React.FC<DynamicTableProps> = ({
  entity,
  data,
  onAdd,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const { t, i18n } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  const getLabel = (field: any) => {
    if (field.label && field.label[i18n.language]) {
      return field.label[i18n.language];
    }

    return field.label?.['en'] || field.name;
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();

    formData.append('file', file);

    setUploading(true);

    try {
      // 🔥 Get token from localStorage
      const token = localStorage.getItem('token');

      // 🔥 Send upload request with auth token
      await api.post(
        `/${entity.name}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert('CSV uploaded successfully!');

      onRefresh();

    } catch (err: any) {

      console.error('CSV Upload Error:', err);

      alert(
        err?.response?.data?.message ||
        'CSV Upload failed. Make sure columns match the configuration.'
      );

    } finally {

      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 rounded-3xl overflow-hidden transition-all">

      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">

        <div className="flex items-center gap-3">

          <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
            <LayoutGrid size={22} />
          </div>

          <h2 className="text-2xl font-bold capitalize text-slate-900">
            {entity.name}
          </h2>

          <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
            {data.length} Total
          </span>

        </div>

        <div className="flex gap-3 w-full sm:w-auto">

          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all shadow-sm"
          >
            <UploadCloud
              size={18}
              className="text-indigo-500"
            />

            {uploading ? 'Uploading...' : t('upload_csv')}
          </button>

          <button
            onClick={onAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 rounded-xl shadow-md shadow-indigo-500/20 transform transition-all active:scale-95"
          >
            <Plus size={18} />

            {t('add_new')}
          </button>

        </div>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm text-left">

          <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">

            <tr>

              {entity.fields.map(field => (
                <th
                  key={field.name}
                  className="px-6 py-4 font-bold tracking-wider"
                >
                  {getLabel(field)}
                </th>
              ))}

              <th className="px-6 py-4 font-bold tracking-wider text-right">
                {t('actions')}
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-slate-50">

            {data.length === 0 ? (

              <tr>

                <td
                  colSpan={entity.fields.length + 1}
                  className="px-6 py-12 text-center"
                >

                  <div className="flex flex-col items-center justify-center text-slate-400">

                    <LayoutGrid
                      size={48}
                      className="mb-4 text-slate-200"
                    />

                    <p className="text-lg font-medium text-slate-600">
                      No records found
                    </p>

                    <p className="text-sm">
                      Get started by creating a new record.
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              data.map((record) => (

                <tr
                  key={record.id}
                  className="bg-white hover:bg-indigo-50/30 transition-colors group"
                >

                  {entity.fields.map(field => (

                    <td
                      key={field.name}
                      className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap"
                    >

                      {field.type === 'checkbox' ? (

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            record[field.name]
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {record[field.name] ? 'Yes' : 'No'}
                        </span>

                      ) : (

                        record[field.name]?.toString() || (
                          <span className="text-slate-300">-</span>
                        )

                      )}

                    </td>

                  ))}

                  <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                    <button
                      onClick={() => onEdit(record)}
                      className="text-indigo-600 hover:text-indigo-800 p-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => onDelete(record.id)}
                      className="text-red-600 hover:text-red-800 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
};