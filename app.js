function renderProfile() {
  els.playerName.value = state.profile.name || "Rainbow";
  els.playerUid.value = state.profile.uid || "";

  // Fix: Ensure Profile Image displays
  if (state.profile.imageDataUrl) {
    els.profilePreview.src = state.profile.imageDataUrl;
    els.profilePreview.style.display = "block"; // Forces the image to be visible
    const placeholder = document.querySelector(".avatar-placeholder");
    if (placeholder) placeholder.style.display = "none";
  }

  // Fix: Ensure Banner Image displays
  if (state.profile.bannerDataUrl) {
    els.bannerPreview.src = state.profile.bannerDataUrl;
    els.bannerPreview.style.display = "block"; // Forces the banner to be visible
    if (els.bannerPlaceholder) els.bannerPlaceholder.style.display = "none";
  }

  els.bannerPosition.value = String(state.profile.bannerPosition ?? 50);
  applyBannerPosition();
  renderProfileEditorState();
}
