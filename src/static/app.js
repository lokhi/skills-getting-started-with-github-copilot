document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const emailInput = document.getElementById("email");
  const messageDiv = document.getElementById("message");
  let messageTimeout;

  function showMessage(message, type) {
    clearTimeout(messageTimeout);
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function refreshActivities() {
    const selectedActivity = activitySelect.value;

    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Unable to load activities");
      }
      const activities = await response.json();
      const activityEntries = Object.entries(activities);

      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      if (activityEntries.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "empty-state";
        emptyState.textContent = "No activities are available right now.";
        activitiesList.appendChild(emptyState);
      }

      activityEntries.forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        const spotsLeft = details.max_participants - details.participants.length;

        const heading = document.createElement("h4");
        heading.textContent = name;
        activityCard.appendChild(heading);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, document.createTextNode(details.schedule));
        activityCard.appendChild(schedule);

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.append(availabilityLabel, document.createTextNode(`${spotsLeft} spots left`));
        activityCard.appendChild(availability);

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        activityCard.appendChild(participantsHeading);

        if (details.participants.length === 0) {
          const emptyParticipants = document.createElement("p");
          emptyParticipants.className = "empty-state";
          emptyParticipants.textContent = "No students registered yet.";
          activityCard.appendChild(emptyParticipants);
        } else {
          const participantList = document.createElement("ul");
          participantList.className = "participant-list";

          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove";
            removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
            removeButton.title = `Unregister ${email}`;
            removeButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="M5 2h6l1 2h2v1H2V4h2l1-2Zm-1 4h8l-.6 8H4.6L4 6Zm2 1v5h1V7H6Zm3 0v5h1V7H9Z"/></svg>';
            removeButton.addEventListener("click", () => unregisterParticipant(name, email));

            participant.append(participantEmail, removeButton);
            participantList.appendChild(participant);
          });

          activityCard.appendChild(participantList);
        }

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      if (activityEntries.some(([name]) => name === selectedActivity)) {
        activitySelect.value = selectedActivity;
      }
      return true;
    } catch (error) {
      activitiesList.textContent = "Failed to load activities. Please try again later.";
      console.error("Error fetching activities:", error);
      return false;
    }
  }

  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "Could not unregister this student.", "error");
        return;
      }

      const refreshed = await refreshActivities();
      showMessage(
        refreshed ? result.message : `${result.message}, but the activity list could not be refreshed.`,
        refreshed ? "success" : "error"
      );
    } catch (error) {
      showMessage("Failed to unregister the student. Please try again.", "error");
      console.error("Error unregistering student:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "Could not sign up for this activity.", "error");
        return;
      }

      emailInput.value = "";
      const refreshed = await refreshActivities();
      showMessage(
        refreshed ? result.message : `${result.message}, but the activity list could not be refreshed.`,
        refreshed ? "success" : "error"
      );
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  refreshActivities();
});
