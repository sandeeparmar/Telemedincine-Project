import xmlbuilder from "xmlbuilder" ;

export const generateODM = (patient , encounters) => {  
  const odm = xmlbuilder.create("ODM")  ;
  const clinicalData = odm.ele("ClinicalData") ;

  const subject = clinicalData.ele("SubjectData" , {
    SubjectKey : patient._id 
  }) ;

  encounters.forEach(e => {
    const studyEvent = subject.ele("StudyEventData") ;

    studyEvent.ele("ItemGroupData").ele("ItemData" , {
       Name : "Diagnosis" , 
       Value : e.diagnosis 
    }) ;

    const medicationString = e.medications && e.medications.length > 0
      ? e.medications.map(m => `${m.name || ""} (${m.dosage || ""}, ${m.frequency || ""}, ${m.duration || ""})`).join("; ")
      : "None";

    studyEvent.ele("ItemGroupData").ele("ItemData" , {
      Name : "Medication" ,
      Value  : medicationString
    }) ;
  }) ; 
  return odm.end({pretty : true}) ;
} ;