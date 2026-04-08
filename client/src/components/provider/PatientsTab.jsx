import React, { useState } from "react";
import { Search, Users } from "lucide-react";
import PatientDetailPanel from "./PatientDetailPanel";
import { cn } from "@/lib/utils";

const PatientsTab = ({ patients, selectedPatient: externalSelected, onSelectPatient: externalSetSelected }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [internalSelected, setInternalSelected] = useState(null);

  // Use external state if provided, otherwise fall back to internal
  const selectedPatient = externalSelected !== undefined ? externalSelected : internalSelected;
  const setSelectedPatient = externalSetSelected ?? setInternalSelected;

  const filteredPatients = (patients || []).filter((p) => {
    if (!searchTerm) return true;
    const name =
      `${p.profile?.firstName} ${p.profile?.lastName}`.toLowerCase();
    const email = (p.email || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  if (selectedPatient) {
    return (
      <PatientDetailPanel
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
      />
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      {/* Patient Grid */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {patients?.length === 0 ? "No Patients Yet" : "No Results"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {patients?.length === 0
              ? "Patients will appear here once appointments are booked."
              : "No patients match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient._id}
              onClick={() => setSelectedPatient(patient)}
              className={cn(
                "p-4 rounded-xl border border-border bg-card cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {patient.profile?.firstName?.[0]}
                  {patient.profile?.lastName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">
                    {patient.profile?.firstName} {patient.profile?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {patient.email}
                  </p>
                </div>
              </div>
              {(patient.patientInfo?.bloodType ||
                patient.patientInfo?.allergies?.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {patient.patientInfo?.bloodType && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, #ef4444 20%, var(--surface))", color: "#ef4444" }}>
                      {patient.patientInfo.bloodType}
                    </span>
                  )}
                  {patient.patientInfo?.allergies?.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, #f97316 20%, var(--surface))", color: "#f97316" }}>
                      {patient.patientInfo.allergies.length} allergy(ies)
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientsTab;
