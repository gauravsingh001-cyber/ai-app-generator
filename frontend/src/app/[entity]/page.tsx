'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConfigStore } from '../../store/configStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';
import { DynamicTable } from '../../components/DynamicTable';
import { DynamicForm } from '../../components/DynamicForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EntityPage() {

  const { entity } = useParams();

  const { config, loading: configLoading } = useConfigStore();

  const { token } = useAuthStore();

  const router = useRouter();

  const [data, setData] = useState<any[]>([]);

  const [loadingData, setLoadingData] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingRecord, setEditingRecord] = useState<any>(null);

  // =========================
  // FETCH DATA
  // =========================

  const fetchData = async () => {

    setLoadingData(true);

    try {

      const res = await api.get(`/${entity}`);

      console.log('API RESPONSE =>', res.data);

      // ✅ Handle multiple backend response structures
      const records =
        Array.isArray(res.data)
          ? res.data
          : res.data.records ||
            res.data.data ||
            [];

      setData(records);

    } catch (err) {

      console.error('FETCH ERROR =>', err);

    } finally {

      setLoadingData(false);

    }
  };

  // =========================
  // AUTH + INITIAL FETCH
  // =========================

  useEffect(() => {

    if (!token) {

      router.push('/login');

      return;

    }

    if (entity) {

      fetchData();

    }

  }, [entity, token]);

  // =========================
  // CURRENT ENTITY
  // =========================

  const currentEntity = config?.entities.find(
    e => e.name === entity
  );

  // =========================
  // LOADING
  // =========================

  if (configLoading || loadingData) {

    return (
      <div className="flex items-center justify-center h-64">

        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>

      </div>
    );
  }

  // =========================
  // ENTITY NOT FOUND
  // =========================

  if (!currentEntity) {

    return (

      <div className="text-center py-20">

        <h2 className="text-2xl font-bold text-gray-800">
          Entity not found
        </h2>

        <p className="text-gray-500 mt-2">
          The requested entity "{entity}" is not configured.
        </p>

        <Link
          href="/"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Go back home
        </Link>

      </div>
    );
  }

  // =========================
  // CREATE / UPDATE
  // =========================

  const handleSubmit = async (formData: any) => {

    try {

      if (editingRecord) {

        await api.put(
          `/${entity}/${editingRecord.id}`,
          formData
        );

      } else {

        await api.post(
          `/${entity}`,
          formData
        );

      }

      setIsFormOpen(false);

      setEditingRecord(null);

      fetchData();

    } catch (err: any) {

      console.error(err);

      alert(
        err.response?.data?.error ||
        'Validation failed'
      );
    }
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (id: string) => {

    if (
      !confirm(
        'Are you sure you want to delete this record?'
      )
    ) return;

    try {

      await api.delete(`/${entity}/${id}`);

      fetchData();

    } catch (err) {

      console.error(err);

    }
  };

  // =========================
  // UI
  // =========================

  return (

    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">

      <Link
        href="/"
        className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 w-fit mb-4"
      >

        <ArrowLeft
          size={18}
          className="mr-2"
        />

        Back to Dashboard

      </Link>

      {isFormOpen ? (

        <div className="animate-in fade-in zoom-in-95 duration-300">

          <div className="mb-6">

            <h2 className="text-3xl font-extrabold text-slate-900">

              {editingRecord
                ? 'Edit Record'
                : 'Create New Record'}

            </h2>

            <p className="text-slate-500 font-medium mt-2">

              Fill in the details for this{' '}
              {currentEntity.name} record.

            </p>

          </div>

          <DynamicForm
            entity={currentEntity}
            initialData={editingRecord}
            onSubmit={handleSubmit}
            onCancel={() => {

              setIsFormOpen(false);

              setEditingRecord(null);

            }}
          />

        </div>

      ) : (

        <DynamicTable
          entity={currentEntity}
          data={data}
          onAdd={() => {

            setEditingRecord(null);

            setIsFormOpen(true);

          }}
          onEdit={(record) => {

            setEditingRecord(record);

            setIsFormOpen(true);

          }}
          onDelete={handleDelete}
          onRefresh={fetchData}
        />

      )}

    </div>
  );
}