export default (sp: any) => {
  // Mercur 1.5.3 returns profiles directly, while older vendor endpoints
  // returned seller-profile links with the profile nested on the relation.
  const shippingProfile = sp.shipping_profile ?? sp
  const name = shippingProfile.name.includes(":")
    ? shippingProfile.name.split(":")[1]
    : shippingProfile.name

  return {
    ...sp,
    shipping_profile: {
      ...shippingProfile,
      name,
    },
  }
}
