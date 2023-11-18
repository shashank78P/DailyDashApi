export const individualMeetingDetails = [
  {
    $addFields: {
      meetingLength: {
        $split: ["$meetingLength", " "],
      },
    },
  },
  {
    $addFields: {
      meetingLength: {
        $convert: {
          input: {
            $first: "$meetingLength",
          },
          to: "int",
        },
      },
      meetingLengthPararmeter: {
        $last: "$meetingLength",
      },
    },
  },
  {
    $addFields: {
      meetingEndingAt: {
        $dateAdd: {
          startDate: "$meetingDate",
          unit: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: [
                      "$meetingLengthPararmeter",
                      "min",
                    ],
                  },
                  then: "minute",
                },
                {
                  case: {
                    $eq: [
                      "$meetingLengthPararmeter",
                      "day",
                    ],
                  },
                  then: "day",
                },
                {
                  case: {
                    $eq: [
                      "$meetingLengthPararmeter",
                      "hr",
                    ],
                  },
                  then: "hour",
                },
                {
                  case: {
                    $eq: [
                      "$meetingLengthPararmeter",
                      "sec",
                    ],
                  },
                  then: "second",
                },
                {
                  case: {
                    $eq: [
                      "$meetingLengthPararmeter",
                      "mon",
                    ],
                  },
                  then: "month",
                },
              ],
              default: "hour",
            },
          },
          amount: "$meetingLength",
        },
      },
    },
  },
  {
    $addFields: {
      meetingStatus: {
        $switch: {
          branches: [
            {
              case: {
                $gt: [
                  new Date(),
                  "$meetingEndingAt",
                ],
              },
              then: "Completed",
            },
            {
              case: {
                $lt: [new Date(), "$meetingDate"],
              },
              then: "Not Started",
            },
            {
              case: {
                $and: [
                  {
                    $lte: [
                      new Date(),
                      "$meetingEndingAt",
                    ],
                  },
                  {
                    $gte: [
                      new Date(),
                      "$meetingDate",
                    ],
                  },
                ],
              },
              then: "On Going",
            },
          ],
          default: "Error",
        },
      },
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "createdBy",
      foreignField: "_id",
      as: "user",
    },
  },
  {
    $unwind: "$user",
  },
  {
    $addFields: {
      createrName: {
        $concat: [
          {
            $ifNull: ["$user.firstName", ""],
          },
          " ",
          {
            $ifNull: ["$user.firstLast", ""],
          },
        ],
      },
    },
  },
  {
    $lookup: {
      from: "meetingparticipants",
      localField: "_id",
      foreignField: "belongsTo",
      as: "participants",
    },
  },
  {
    $addFields: {
      participantsCount: {
        $size: "$participants",
      },
    },
  },
  {
    $project: {
      title: 1,
      description: 1,
      meetingDate: 1,
      whoCanJoin: 1,
      createdAt: 1,
      createdBy: 1,
      createrName: 1,
      // createrPic : "$user.profilePic",
      participantsCount: 1,
      meetingLength: 1,
      meetingLengthPararmeter: 1,
      meetingEndingAt: 1,
      meetingStatus: 1,
      meetingId: "$belongsTo",
    },
  },
]

const MeetingDetailsQuery = [
  {
    $lookup: {
      from: "meets",
      localField: "belongsTo",
      foreignField: "_id",
      as: "meet",
    },
  },
  {
    $unwind: "$meet",
  },
  {
    $project: {
      participantId: 1,
      belongsTo: 1,
      isAttended: 1,
      isInMeeting: 1,
      _id: "$meet._id",
      title: "$meet.title",
      description: "$meet.description",
      meetingDate: "$meet.meetingDate",
      meetingLength: "$meet.meetingLength",
      whoCanJoin: "$meet.whoCanJoin",
      createdAt: "$meet.createdAt",
      updatedAt: "$meet.updatedAt",
      createdBy: "$meet.createdBy",
    },
  }, 
  ...individualMeetingDetails
]



export default MeetingDetailsQuery

export const getParticipantsQuery = [
  {
    $lookup: {
      from: "users",
      localField: "participantId",
      foreignField: "_id",
      as: "user",
    },
  },
  {
    $unwind: "$user",
  },
  {
    $project: {
      participantId: 1,
      belongsTo: 1,
      isAttended: 1,
      isInMeeting: 1,
      createdAt: 1,
      userName: {
        $concat: [
          {
            $ifNull: ["$user.firstName", " "],
          },
          " ",
          {
            $ifNull: ["$user.lastName", " "],
          },
        ],
      },
      userPic: "$user.profilePic",
      emial: "$user.email",
    },
  }
]