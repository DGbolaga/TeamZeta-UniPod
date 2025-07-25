document.addEventListener("DOMContentLoaded", function () {
  const steps = document.querySelectorAll(".form-step");
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const finishBtn = document.getElementById("finishBtn");
  let currentStep = 0;

  function showStep(stepIndex) {
    steps.forEach((step, index) => {
      step.classList.toggle("active", index === stepIndex);
    });

    prevBtn.style.display = stepIndex > 0 ? "inline-block" : "none";
    nextBtn.style.display = stepIndex < steps.length - 1 ? "inline-block" : "none";
    finishBtn.style.display = stepIndex === steps.length - 1 ? "inline-block" : "none";
  }

  nextBtn.addEventListener("click", () => {
    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  });

  showStep(currentStep);
});
