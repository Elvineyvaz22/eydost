import AdminLayout from '../../components/admin/AdminLayout';

export default function SectionsEditor() {
  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Bölmələr</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-700 mb-4">
            Bu bölmədə "Necə İşləyir", "Niyə Ey Dost?" və digər bölmələrin məzmununu redaktə edə bilərsiniz.
          </p>
          <p className="text-gray-600 text-sm">
            Hal-hazırda bölmələrin redaktəsi "Tərcümələr" səhifəsindən edilə bilər.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
