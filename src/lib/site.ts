import site from "../../data/site.json";

export const businessName = site.businessName;
export const brandTitle = site.brandTitle;
export const contactNumber = site.contactNumber;
export const whatsappUrl = `https://wa.me/91${site.contactNumber}`;
export const callUrl = `tel:+91${site.contactNumber}`;
export const siteAssets = {
  logo: site.logoImage,
  hero: site.heroImage
};
