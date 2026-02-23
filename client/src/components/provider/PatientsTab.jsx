import React, { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import PatientDetailPanel from "./PatientDetailPanel";
import { Card, CardContent } from "../ui/card";

function PatientsTab({ patients = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((patient) => {
      return [patient.fullName, patient.condition, patient.email]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query));
    });
  }, [patients, searchTerm]);

  if (selectedPatient) {
    return <PatientDetailPanel patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search patients by name, condition, or email"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <Card className="rounded-[24px]">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Users className="h-10 w-10 text-slate-300" />
            <div>
              <p className="text-lg font-semibold text-slate-900">No matching patients</p>
              <p className="mt-1 text-sm text-slate-500">Try a broader search or clear the current query.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPatients.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => setSelectedPatient(patient)}
              className="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{patient.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">{patient.condition}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {patient.bloodType}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>{patient.email}</p>
                <p>Recent metric: {patient.recentMetric.label} · {patient.recentMetric.value}</p>
                <p>Last visit: {patient.lastVisit}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PatientsTab;
