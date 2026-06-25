import { Notification } from '../models/dbClient.js';

export const getNotifications = async (req, res) => {
  try {
    const { role, agentId } = req.user;
    let filter = {};

    if (role === 'ADMIN') {
      filter.recipientRole = 'ADMIN';
    } else if (role === 'AGENT') {
      filter.recipientRole = 'AGENT';
      filter.recipientId = agentId;
    }

    const notifications = await Notification.find(filter);
    // Sort descending by createdAt in JS if in mockDb, mongoose can do it with sort but our find returns array.
    // Let's sort array by date
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Security check
    if (req.user.role === 'AGENT' && notification.recipientId !== req.user.agentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { role, agentId } = req.user;
    let filter = { read: false };

    if (role === 'ADMIN') {
      filter.recipientRole = 'ADMIN';
    } else if (role === 'AGENT') {
      filter.recipientRole = 'AGENT';
      filter.recipientId = agentId;
    }

    // We can do find and update them, since deleteMany/updateMany is simpler.
    // In our MockModel, we have deleteMany. Let's update all matching in JS first or call update on all.
    const unread = await Notification.find(filter);
    for (let note of unread) {
      await Notification.findByIdAndUpdate(note._id || note.id, { read: true });
    }

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
