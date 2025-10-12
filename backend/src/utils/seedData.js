// src/utils/seeder.mjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rewearify');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ DB Connection Error:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    // Clear collections
    const collections = ['users', 'donations', 'requests', 'matches', 'notifications'];
    for (const collection of collections) {
      try {
        await mongoose.connection.db.dropCollection(collection);
      } catch (e) {
        // Ignore if collection doesn't exist
      }
    }
    console.log('🗑️ Cleared all collections');

    // ===== USERS =====
    const User = (await import('../models/User.js')).default;

    const usersData = [
      {
        name: "Sarah Johnson",
        email: "sarah@email.com",
        password: "password123",
        role: "donor",
        location: {
          address: "123 Main St",
          city: "New York",
          state: "New York",
          country: "USA",
          zipCode: "10001"
        },
        contact: {
          phone: "+1234567890"
        },
        verification: { isEmailVerified: true },
        status: "active"
      },
      {
        name: "Michael",
        email: "michael@kindhands.org",
        password: "password123",
        role: "recipient",
        location: {
          address: "123 Service Road",
          city: "Shimoga",
          state: "Karnataka",
          country: "India",
          zipCode: "577201"
        },
        contact: {
          phone: "+91 9876543210"
        },
        organization: {
          name: "Kind Hands",
          type: "NGO",
          description: "Dedicated to helping underprivileged communities with clothing and basic necessities."
        },
        verification: { 
          isEmailVerified: true,
          isOrganizationVerified: true
        },
        status: "active"
      },
      {
        name: "Admin User",
        email: "admin@rewearify.com",
        password: "admin123",
        role: "admin",
        location: {
          address: "Admin Building",
          city: "San Francisco",
          state: "California",
          country: "USA",
          zipCode: "94105"
        },
        verification: { isEmailVerified: true },
        status: "active"
      }
    ];

    const usersWithHash = await Promise.all(
      usersData.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 12)
      }))
    );

    const insertedUsers = await User.insertMany(usersWithHash);
    console.log(`👤 Inserted ${insertedUsers.length} users`);

    const donor = insertedUsers.find(u => u.email === 'sarah@email.com');
    const recipient = insertedUsers.find(u => u.email === 'michael@kindhands.org');
    const admin = insertedUsers.find(u => u.email === 'admin@rewearify.com');

    // ===== DONATIONS =====
    const Donation = (await import('../models/Donation.js')).default;

    const donationsData = [
      {
        donor: donor._id,
        title: "Winter Coats Collection",
        description: "High-quality winter coats for adults and children",
        category: "outerwear",
        condition: "excellent",
        quantity: 5,
        sizes: [
          { size: "S", quantity: 2 },
          { size: "M", quantity: 2 },
          { size: "L", quantity: 1 }
        ],
        colors: ["Black", "Navy", "Brown"],
        images: [
          "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
        ],
        location: {
          address: "123 Main St",
          city: "New York",
          state: "New York",
          country: "USA",
          zipCode: "10001"
        },
        pickupAvailable: true,
        deliveryRadius: 25,
        status: "approved",
        aiAnalysis: {
          categoryConfidence: 0.95,
          conditionScore: 0.88,
          demandPrediction: "high",
          matchingTags: ["winter", "adults", "children"]
        },
        moderation: {
          approvedBy: admin._id,
          approvedAt: new Date("2025-09-09")
        }
      },
      {
        donor: donor._id,
        title: "Kids School Uniforms",
        description: "Clean school uniforms for elementary school children",
        category: "children",
        condition: "excellent",
        quantity: 12,
        sizes: [
          { size: "6-7Y", quantity: 3 },
          { size: "8-9Y", quantity: 4 },
          { size: "10-11Y", quantity: 3 },
          { size: "12-13Y", quantity: 2 }
        ],
        colors: ["Navy", "White", "Khaki"],
        images: [
          "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1986&q=80"
        ],
        location: {
          address: "123 Main St",
          city: "New York",
          state: "New York",
          country: "USA",
          zipCode: "10001"
        },
        pickupAvailable: false,
        deliveryRadius: 15,
        status: "approved",
        aiAnalysis: {
          categoryConfidence: 0.98,
          conditionScore: 0.91,
          demandPrediction: "high",
          matchingTags: ["school", "uniform", "children", "education"]
        },
        moderation: {
          approvedBy: admin._id,
          approvedAt: new Date("2025-09-09")
        }
      }
    ];

    const insertedDonations = await Donation.insertMany(donationsData);
    console.log(`👕 Inserted ${insertedDonations.length} donations`);

    // ===== REQUESTS =====
    const Request = (await import('../models/Request.js')).default;

    const requestsData = [
      {
        requester: recipient._id,
        title: "Winter Clothing for Families",
        description: "Urgent need for winter coats for homeless community.",
        category: "outerwear",
        urgency: "high",
        quantity: 3,
        sizes: [
          { size: "M", quantity: 2 },
          { size: "L", quantity: 1 }
        ],
        beneficiaries: {
          count: 10,
          ageGroup: "mixed",
          gender: "mixed"
        },
        location: {
          address: "123 Service Road",
          city: "Shimoga",
          state: "Karnataka",
          country: "India",
          zipCode: "577201"
        },
        timeline: {
          neededBy: new Date("2025-11-30")
        },
        status: "matched",
        donation: insertedDonations[0]._id,
        matching: {
          matchedAt: new Date("2025-09-10"),
          matchScore: 0.92,
          autoMatched: false
        }
      },
      {
        requester: recipient._id,
        title: "School Uniforms for Children",
        description: "Supporting families who cannot afford school uniforms.",
        category: "children",
        urgency: "medium",
        quantity: 8,
        sizes: [
          { size: "8-9Y", quantity: 4 },
          { size: "10-11Y", quantity: 4 }
        ],
        beneficiaries: {
          count: 8,
          ageGroup: "children",
          gender: "mixed"
        },
        location: {
          address: "123 Service Road",
          city: "Shimoga",
          state: "Karnataka",
          country: "India",
          zipCode: "577201"
        },
        timeline: {
          neededBy: new Date("2025-10-31")
        },
        status: "active"
      }
    ];

    const insertedRequests = await Request.insertMany(requestsData);
    console.log(`📋 Inserted ${insertedRequests.length} requests`);

    // ===== MATCHES =====
    const Match = (await import('../models/Match.js')).default;

    const matchesData = [
      {
        donation: insertedDonations[0]._id,
        request: insertedRequests[0]._id,
        donor: donor._id,
        requester: recipient._id,
        matchScore: 0.92,
        aiAnalysis: {
          categoryMatch: { score: 0.95, confidence: 0.95 },
          locationMatch: { distance: 1200, score: 0.8 },
          urgencyMatch: { score: 0.9, reasoning: "High urgency request" },
          sizeMatch: {
            score: 0.95,
            availableSizes: ["S", "M", "L"],
            requestedSizes: ["M", "L"]
          },
          overallReasons: ["Perfect category match", "Good size availability"],
          recommendations: ["Schedule pickup within 3 days"]
        },
        status: "accepted",
        acceptance: {
          donorAccepted: true,
          donorAcceptedAt: new Date("2025-09-10T10:00:00Z"),
          requesterAccepted: true,
          requesterAcceptedAt: new Date("2025-09-10T11:00:00Z")
        }
      }
    ];

    await Match.insertMany(matchesData);
    console.log(`🔗 Inserted ${matchesData.length} matches`);

    // ===== NOTIFICATIONS =====
    const Notification = (await import('../models/Notification.js')).default;

    const notificationsData = [
      // For Donor (Sarah)
      {
        recipient: donor._id,
        type: "donation_approved",
        title: "Donation Approved!",
        message: "Your winter coats donation has been approved and is now available for requests.",
        data: { donationId: insertedDonations[0]._id, actionUrl: `/dashboard/donations/${insertedDonations[0]._id}` },
        status: "unread",
        priority: "medium"
      },
      {
        recipient: donor._id,
        type: "donation_matched",
        title: "Donation Matched!",
        message: "Your winter coats donation has been matched with Kind Hands.",
        data: { 
          donationId: insertedDonations[0]._id,
          requestId: insertedRequests[0]._id,
          matchId: matchesData[0]._id,
          actionUrl: `/dashboard/matches/${matchesData[0]._id}`
        },
        status: "unread",
        priority: "high"
      },
      {
        recipient: donor._id,
        type: "feedback_request",
        title: "How was your experience?",
        message: "Please rate your donation experience with Kind Hands.",
        data: { donationId: insertedDonations[0]._id, actionUrl: `/dashboard/donations/${insertedDonations[0]._id}/feedback` },
        status: "unread",
        priority: "low"
      },

      // For Recipient (Michael)
      {
        recipient: recipient._id,
        type: "request_matched",
        title: "Request Matched!",
        message: "Your winter clothing request has been matched with Sarah Johnson.",
        data: { 
          requestId: insertedRequests[0]._id,
          donationId: insertedDonations[0]._id,
          matchId: matchesData[0]._id,
          actionUrl: `/dashboard/matches/${matchesData[0]._id}`
        },
        status: "unread",
        priority: "high"
      },
      {
        recipient: recipient._id,
        type: "new_donation_nearby",
        title: "New Donation Available",
        message: "Kids school uniforms available in your area.",
        data: { donationId: insertedDonations[1]._id, actionUrl: `/dashboard/donations/${insertedDonations[1]._id}` },
        status: "unread",
        priority: "medium"
      }
    ];

    await Notification.insertMany(notificationsData);
    console.log(`🔔 Inserted ${notificationsData.length} notifications`);

    console.log('\n🎉 SUCCESS! Your ReWearify database is fully seeded with:');
    console.log('- 3 Users (Donor, Recipient, Admin)');
    console.log('- 2 Donations (approved)');
    console.log('- 2 Requests (1 matched, 1 active)');
    console.log('- 1 Match (accepted)');
    console.log('- 5 Notifications (all unread)');

    process.exit(0);
  } catch (error) {
    console.error('🔥 Seeding failed:', error);
    process.exit(1);
  }
};

await connectDB();
await seedDatabase();