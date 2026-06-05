import createModel from "./model";

const Settings = createModel("Settings");
export default Settings;

export interface ISettings {
  id?: string;
  _id?: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  website: string;
  financialYearStart: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getOrganizationSettings() {
  let settings = await Settings.findOne({ id: "organization" });
  if (!settings) {
    settings = await Settings.create({
      id: "organization",
      companyName: "Molyweb Digital Solutions Private Limited",
      email: "sales@molyweb.com",
      phone: "9453354551",
      address: "Flat No. 102, Om Plaza Apartment, Sector-19, Indira Nagar",
      city: "Lucknow",
      state: "Uttar Pradesh",
      pincode: "226016",
      gstin: "09AAACM5601QZM",
      pan: "AAACM5601Q",
      website: "www.molyweb.com",
      financialYearStart: "April",
    });
  }
  return settings;
}
