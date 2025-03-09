export default function addNotification(notification) {
  const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
  notifications.push({ ...notification, id: Date.now() });
  localStorage.setItem("notifications", JSON.stringify(notifications));
}
