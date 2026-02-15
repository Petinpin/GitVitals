"use client"

import React, { useState } from "react"
import { Search, CheckCircle2, AlertTriangle, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const patients = [
  { id: 1, name: "John Smith" },
  { id: 2, name: "Mary Johnson" },
  { id: 3, name: "Robert Williams" },
  { id: 4, name: "Patricia Brown" },
  { id: 5, name: "Michael Davis" },
]

type FormValues = {
  age_years: string
  heart_rate: string
  resp_rate: string
  temp_f: string
  spo2_pct: string
  systolic_bp: string
  diastolic_bp: string
  height_ft: string
  height_in: string
  weight_lb: string
  pain_0_10: string
}

const initialValues: FormValues = {
  age_years: "",
  heart_rate: "",
  resp_rate: "",
  temp_f: "",
  spo2_pct: "",
  systolic_bp: "",
  diastolic_bp: "",
  height_ft: "",
  height_in: "",
  weight_lb: "",
  pain_0_10: "",
}

const fields: { key: keyof FormValues; label: string; placeholder: string; step?: string; unit?: string }[] = [
  { key: "age_years", label: "Age", placeholder: "35", unit: "years" },
  { key: "heart_rate", label: "Heart Rate", placeholder: "72", unit: "bpm" },
  { key: "resp_rate", label: "Respiratory Rate", placeholder: "16", unit: "rpm" },
  { key: "temp_f", label: "Temperature", placeholder: "98.6", step: "0.1", unit: "°F" },
  { key: "spo2_pct", label: "Pulse Oximetry", placeholder: "98", unit: "%" },
  { key: "pain_0_10", label: "Pain Level", placeholder: "3", unit: "0-10" },
  { key: "systolic_bp", label: "Systolic BP", placeholder: "120", unit: "mmHg" },
  { key: "diastolic_bp", label: "Diastolic BP", placeholder: "80", unit: "mmHg" },
  { key: "height_ft", label: "Height (ft)", placeholder: "5", unit: "ft" },
  { key: "height_in", label: "Height (in)", placeholder: "10", unit: "in" },
  { key: "weight_lb", label: "Weight", placeholder: "165", unit: "lb" },
]

export default function SubmitVitalsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPatients, setFilteredPatients] = useState<typeof patients>([])
  const [selectedPatient, setSelectedPatient] = useState<(typeof patients)[0] | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [prediction, setPrediction] = useState<{ pred_flag: number; p_flag: number } | null>(null)
  const [formValues, setFormValues] = useState<FormValues>(initialValues)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (value.length > 0) {
      setFilteredPatients(patients.filter((p) => p.name.toLowerCase().includes(value.toLowerCase())))
    } else {
      setFilteredPatients([])
    }
  }

  const selectPatient = (p: (typeof patients)[0]) => {
    setSelectedPatient(p)
    setSearchTerm(p.name)
    setFilteredPatients([])
  }

  const updateField = (key: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    const payload = Object.fromEntries(
      Object.entries(formValues).map(([k, v]) => [k, Number(v)])
    )

    try {
      const res = await fetch("/api/vitals/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data?.prediction) {
        setPrediction({ pred_flag: data.prediction.pred_flag, p_flag: data.prediction.p_flag })
      }
      setShowModal(true)
    } catch {
      setShowModal(true)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Submit Patient Vitals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record vital signs for a registered patient with ML-powered risk assessment.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Patient Selection */}
        <Card className="border-border shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Search className="h-5 w-5 text-primary" />
              Patient Selection
            </CardTitle>
            <CardDescription>Search and select the patient you are examining</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Label htmlFor="patient-search" className="sr-only">
                Search patient
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="patient-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Start typing a patient name..."
                  className="pl-9 transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {filteredPatients.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-in fade-in slide-in-from-top-2">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPatient(p)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-primary/10"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-primary">
                    Selected: {selectedPatient.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vitals Measurements */}
        <Card className="border-border shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Activity className="h-5 w-5 text-primary" />
              Vitals Measurements
            </CardTitle>
            <CardDescription>Enter all measured vital signs with units</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={field.key} className="text-sm font-medium">
                    {field.label}
                    {field.unit && <span className="ml-1 text-muted-foreground">({field.unit})</span>}
                  </Label>
                  <Input
                    id={field.key}
                    type="number"
                    step={field.step}
                    required
                    placeholder={field.placeholder}
                    value={formValues[field.key]}
                    onChange={updateField(field.key)}
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full shadow-md transition-all hover:shadow-lg sm:w-auto sm:self-end"
          disabled={!selectedPatient}
        >
          <Activity className="mr-2 h-5 w-5" />
          Submit Vitals
        </Button>
      </form>

      {/* Success Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Submission Complete</DialogTitle>
            <DialogDescription>
              The vitals have been recorded successfully and analyzed by our ML model.
            </DialogDescription>
          </DialogHeader>
          {prediction && (
            <div className={`flex items-start gap-3 rounded-lg p-4 ${
              prediction.pred_flag === 1 ? 'bg-destructive/10 border border-destructive/20' : 'bg-primary/10 border border-primary/20'
            }`}>
              <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
                prediction.pred_flag === 1 ? 'text-destructive' : 'text-primary'
              }`} />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Risk Assessment: {prediction.pred_flag === 1 ? "⚠️ High Risk" : "✓ Low Risk"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Model Confidence: {(prediction.p_flag * 100).toFixed(2)}%
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {prediction.pred_flag === 1 
                    ? "The vitals indicate elevated risk. Consider immediate clinical review." 
                    : "The vitals appear within normal ranges based on ML analysis."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              onClick={() => setShowModal(false)} 
              className="w-full shadow-sm"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
