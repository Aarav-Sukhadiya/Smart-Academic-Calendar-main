import { createCollegeEvent } from '../services/collegeEvents.js'

const rawCsv = `Group,Subject,Faculty,Day,Start Time,End Time,Classroom,Other Info
A,Fundamental DSA,Utkarsh,Monday,10:30 AM,12:45 PM,Class A - 2nd Floor,Lecture
A,DSA Lab,,Monday,12:45 PM,2:00 PM,Class A - 2nd Floor,Lab
A,Lunch,,Monday,2:00 PM,3:00 PM,,Break
A,React,Mrinal,Monday,3:00 PM,5:00 PM,Class A - 2nd Floor,Lecture
A,React Lab,,Monday,5:00 PM,6:00 PM,Class A - 2nd Floor,Lab
A,Prob & Stats,Akansha,Tuesday,12:30 PM,2:15 PM,Class A - 2nd Floor,Lecture
A,Lunch,,Tuesday,2:15 PM,3:00 PM,,Break
A,English III,Noor,Tuesday,3:00 PM,4:30 PM,Class B1 - 2nd Floor,Lecture
A,Fundamental DSA,Utkarsh,Wednesday,10:30 AM,12:45 PM,Class A - 2nd Floor,Lecture
A,DSA Lab,,Wednesday,12:45 PM,2:00 PM,Class A - 2nd Floor,Lab
A,Lunch,,Wednesday,2:00 PM,3:00 PM,,Break
A,Fundamental DSA,Utkarsh,Thursday,10:30 AM,12:45 PM,Class A - 2nd Floor,Lecture
A,DSA Lab,,Thursday,12:45 PM,2:00 PM,Class A - 2nd Floor,Lab
A,Lunch,,Thursday,2:00 PM,3:00 PM,,Break
A,English III,Noor,Thursday,3:00 PM,4:30 PM,Class B1 - 2nd Floor,Lecture
A,Prob & Stats,Akansha,Friday,12:30 PM,2:15 PM,Class A - 2nd Floor,Lecture
A,Lunch,,Friday,2:15 PM,3:00 PM,,Break
A,React,Mrinal,Friday,3:00 PM,5:00 PM,Class A - 2nd Floor,Lecture
A,React Lab,,Friday,5:00 PM,6:00 PM,Class A - 2nd Floor,Lab
B,React,Mrinal,Monday,10:30 AM,12:45 PM,Class A - 1st Floor,Lecture
B,React Lab,,Monday,12:45 PM,2:00 PM,Class A - 1st Floor,Lab
B,Lunch,,Monday,2:00 PM,3:00 PM,,Break
B,Fundamental DSA,Navdeep,Monday,3:00 PM,5:15 PM,Class C - 2nd Floor,Lecture
B,DSA Lab,,Monday,5:15 PM,6:30 PM,Class C - 2nd Floor,Lab
B,English III,Fiza,Tuesday,11:30 AM,1:15 PM,Class B1 - 2nd Floor,Lecture
B,Lunch,,Tuesday,1:15 PM,2:15 PM,,Break
B,Prob & Stats,Ayush,Tuesday,2:15 PM,4:15 PM,Class A - 2nd Floor,Lecture
B,React,Mrinal,Wednesday,10:30 AM,12:45 PM,Class A - 1st Floor,Lecture
B,React Lab,,Wednesday,12:45 PM,2:00 PM,Class A - 1st Floor,Lab
B,Lunch,,Wednesday,2:00 PM,3:00 PM,,Break
B,Fundamental DSA,Navdeep,Wednesday,3:00 PM,5:15 PM,Class A - 2nd Floor,Lecture
B,DSA Lab,,Wednesday,5:15 PM,6:30 PM,Class A - 2nd Floor,Lab
B,English III,Fiza,Thursday,11:30 AM,1:15 PM,Class B1 - 2nd Floor,Lecture
B,Lunch,,Thursday,1:15 PM,2:15 PM,,Break
B,Prob & Stats,Ayush,Thursday,2:15 PM,4:15 PM,Class A - 2nd Floor,Lecture
B,Lunch,,Friday,2:00 PM,3:00 PM,,Break
B,Fundamental DSA,Navdeep,Friday,3:00 PM,5:15 PM,Class C - 2nd Floor,Lecture
B,DSA Lab,,Friday,5:15 PM,6:30 PM,Class C - 2nd Floor,Lab
C,Fundamental DSA,Navdeep,Monday,10:30 AM,12:45 PM,Class C - 2nd Floor,Lecture
C,DSA Lab,,Monday,12:45 PM,2:00 PM,Class C - 2nd Floor,Lab
C,Lunch,,Monday,2:00 PM,3:00 PM,,Break
C,English III,Fiza,Monday,3:00 PM,4:30 PM,Class B1 - 2nd Floor,Lecture
C,Fundamental DSA,Navdeep,Tuesday,10:30 AM,12:45 PM,Class C - 2nd Floor,Lecture
C,DSA Lab,,Tuesday,12:45 PM,2:00 PM,Class C - 2nd Floor,Lab
C,Lunch,,Tuesday,2:00 PM,3:00 PM,,Break
C,Prob & Stats,Akansha,Tuesday,3:00 PM,4:45 PM,Class A - 2nd Floor,Lecture
C,English III,Fiza,Wednesday,11:30 AM,1:00 PM,Class B1 - 2nd Floor,Lecture
C,Lunch,,Wednesday,1:00 PM,2:00 PM,,Break
C,React,Mrinal,Wednesday,2:30 PM,4:45 PM,Class C - 2nd Floor,Lecture
C,React Lab,,Wednesday,4:45 PM,5:45 PM,Class C - 2nd Floor,Lab
C,Fundamental DSA,Navdeep,Thursday,10:30 AM,12:45 PM,Class C - 2nd Floor,Lecture
C,DSA Lab,,Thursday,12:45 PM,2:00 PM,Class C - 2nd Floor,Lab
C,Lunch,,Thursday,2:00 PM,3:00 PM,,Break
C,Prob & Stats,Akansha,Thursday,3:00 PM,4:45 PM,Class A - 2nd Floor,Lecture
C,React,Mrinal,Friday,10:30 AM,12:45 PM,Class C - 2nd Floor,Lecture
C,React Lab,,Friday,12:45 PM,2:00 PM,Class C - 2nd Floor,Lab
C,Lunch,,Friday,2:00 PM,3:00 PM,,Break`

function parseTime(timeStr) {
  // "10:30 AM" -> "10:30"
  const [time, period] = timeStr.trim().split(' ')
  let [hours, minutes] = time.split(':')
  hours = parseInt(hours, 10)
  
  if (period === 'PM' && hours !== 12) {
    hours += 12
  } else if (period === 'AM' && hours === 12) {
    hours = 0
  }
  
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

const dayMap = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
}

export async function runTimetableSeed(adminUid) {
  const lines = rawCsv.trim().split('\n').slice(1) // Skip header
  
  // Create Date object for "today"
  const today = new Date()
  
  // Walk forward 16 weeks matching the day of week.
  // Instead of complex math, we'll find the most recent Sunday
  const startSunday = new Date(today)
  startSunday.setDate(today.getDate() - today.getDay())
  
  const eventsToCreate = []
  
  for (const line of lines) {
    const [group, subject, faculty, dayName, startT, endT, classroom, type] = line.split(',')
    if (!group) continue
    
    // Default type mapping
    let mappedType = 'lecture'
    if (type.trim().toLowerCase() === 'break') mappedType = 'holiday'
    if (type.trim().toLowerCase() === 'lab') mappedType = 'assignment'
    
    const dayOfWeek = dayMap[dayName.trim()]
    const startTime = parseTime(startT)
    const endTime = parseTime(endT)
    
    // Generate dates for 16 weeks
    for (let w = 0; w < 16; w++) {
      const targetDate = new Date(startSunday)
      targetDate.setDate(startSunday.getDate() + dayOfWeek + (w * 7))
      
      const dateStr = targetDate.toISOString().split('T')[0]
      
      eventsToCreate.push({
        title: `${subject}${faculty ? ' (' + faculty + ')' : ''}`,
        date: dateStr,
        startTime,
        endTime,
        description: `Room: ${classroom || 'TBA'} | Group: ${group}`,
        type: mappedType,
        batch: '2029',
        group: group.trim(),
        subject: subject.trim(),
        faculty: faculty ? faculty.trim() : '',
        classroom: classroom ? classroom.trim() : '',
        createdBy: adminUid
      })
    }
  }

  // To prevent crushing Firebase with simultaneous writes, we'll batch or await sequentially
  let count = 0
  for (const ev of eventsToCreate) {
    await createCollegeEvent(ev)
    count++
    if (count % 10 === 0) {
      console.log(`Seeded ${count} of ${eventsToCreate.length} events...`)
    }
  }
  
  return count
}
