import React, { useRef, useState, useEffect } from 'react';
import { Calendar, User, Settings, Camera, LogOut, CheckCircle, XCircle, Users, UserPlus } from 'lucide-react';

// Mock Webcam component for demo purposes
const Webcam = React.forwardRef(({ audio, screenshotFormat, videoConstraints, className, ...props }, ref) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints || true,
          audio: audio || false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  React.useImperativeHandle(ref, () => ({
    getScreenshot: () => {
      if (!videoRef.current) return null;

      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg');
    }
  }));

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={className}
      style={{ transform: 'scaleX(-1)' }} // Mirror effect
    />
  );
});

const AttendanceDashboard = () => {
  const webcamRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginMode, setLoginMode] = useState('student'); // 'student' or 'admin'
  const [showLogin, setShowLogin] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [detectedUser, setDetectedUser] = useState(null);
  const [blinkInProgress, setBlinkInProgress] = useState(false);

  // Login form states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Registration form states
  const [showRegistration, setShowRegistration] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '', roll: '', dept: 'CSE', username: '', password: ''
  });

  // Student dashboard states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState([]);
  const [semester, setSemester] = useState(1);
  const [subject, setSubject] = useState('maths');

  // Mock data for demonstration
  const [mockStudents, setMockStudents] = useState([
    { id: 1, username: 'john123', password: 'pass123', name: 'John Doe', roll: 'CSE001', dept: 'CSE' },
    { id: 2, username: 'jane456', password: 'pass456', name: 'Jane Smith', roll: 'IT002', dept: 'IT' }
  ]);

  const mockAdmin = { username: 'admin', password: 'admin123' };

  // Mock attendance data
  const mockAttendance = [
    { date: '2025-01-15', present: true, subject: 'maths' },
    { date: '2025-01-16', present: false, subject: 'physics' },
    { date: '2025-01-17', present: true, subject: 'maths' },
    { date: '2025-01-20', present: true, subject: 'chemistry' },
    { date: '2025-01-22', present: false, subject: 'c programming' },
    { date: '2025-01-25', present: true, subject: 'os' }
  ];

  useEffect(() => {
    if (currentUser && currentUser.role === 'student') {
      setAttendanceData(mockAttendance);
    }
  }, [currentUser]);

  const handleLogin = () => {
    setStatus('Ready'); // Clear any previous error messages

    if (loginMode === 'admin') {
      if (loginForm.username === mockAdmin.username && loginForm.password === mockAdmin.password) {
        setCurrentUser({ ...mockAdmin, role: 'admin', name: 'Administrator' });
        setShowLogin(false);
        setStatus('Login successful!');
      } else {
        setStatus('Invalid admin credentials');
      }
    } else {
      const student = mockStudents.find(s =>
        s.username === loginForm.username && s.password === loginForm.password
      );
      if (student) {
        setCurrentUser({ ...student, role: 'student' });
        setShowLogin(false);
        setStatus('Welcome back!');
      } else {
        setStatus('Invalid student credentials');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(true);
    setShowCamera(false);
    setStatus('Ready');
    setLoginForm({ username: '', password: '' });
    setShowRegistration(false);
  };

  const handleRegistration = () => {
    // Validate form fields
    if (!registerForm.name.trim()) {
      setStatus('Please enter student name');
      return;
    }
    if (!registerForm.roll.trim()) {
      setStatus('Please enter roll number');
      return;
    }
    if (!registerForm.username.trim()) {
      setStatus('Please enter username');
      return;
    }
    if (!registerForm.password.trim()) {
      setStatus('Please enter password');
      return;
    }

    // Check if username already exists
    const existingUser = mockStudents.find(s => s.username === registerForm.username);
    if (existingUser) {
      setStatus('Username already exists');
      return;
    }

    // Check if roll number already exists
    const existingRoll = mockStudents.find(s => s.roll === registerForm.roll);
    if (existingRoll) {
      setStatus('Roll number already exists');
      return;
    }

    if (!showCamera) {
      setShowCamera(true);
      setStatus('Position your face in the camera and click "Capture Face"');
      return;
    }

    // Capture face and register
    setStatus('Processing registration...');

    // Get screenshot from webcam
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setStatus('Failed to capture image. Please try again.');
      return;
    }

    // Simulate API call delay
    setTimeout(() => {
      const newStudent = {
        id: mockStudents.length + 1,
        ...registerForm
      };

      setMockStudents(prev => [...prev, newStudent]);
      setStatus(`Successfully registered: ${registerForm.name}`);
      setShowRegistration(false);
      setShowCamera(false);
      setRegisterForm({ name: '', roll: '', dept: 'CSE', username: '', password: '' });
    }, 1500);
  };

  const handleAttendanceCapture = async () => {
    if (!showCamera) {
      setShowCamera(true);
      setStatus('Position your face in the camera and click "Mark Attendance"');
      return;
    }

    setStatus('Processing...');

    // Get screenshot from webcam
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setStatus('Failed to capture image. Please try again.');
      return;
    }

    // Simulate face recognition
    setTimeout(() => {
      // Simulate successful recognition for demo
      const today = new Date().toISOString().split('T')[0];
      const existingAttendance = attendanceData.find(a => a.date === today && a.subject === subject);

      if (existingAttendance) {
        setStatus('Attendance already marked for today in this subject');
      } else {
        setAttendanceData(prev => [...prev, { date: today, present: true, subject }]);
        setStatus('Attendance marked successfully!');
        setShowCamera(false);
      }
    }, 2000);
  };

  const generateCalendar = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const attendance = attendanceData.find(a => a.date === dateStr);
      calendar.push({ day, attendance });
    }

    return calendar;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Attendance System</h1>
            <p className="text-gray-600">Face Recognition Based</p>
          </div>

          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setLoginMode('student');
                setStatus('Ready'); // Clear status when switching modes
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${loginMode === 'student' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Student
            </button>
            <button
              onClick={() => {
                setLoginMode('admin');
                setStatus('Ready'); // Clear status when switching modes
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${loginMode === 'admin' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Admin
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Login as {loginMode === 'admin' ? 'Admin' : 'Student'}
            </button>
          </div>

          {status !== 'Ready' && (
            <div className={`mt-4 p-3 rounded-lg ${status.includes('Invalid') || status.includes('error') || status.includes('exists')
                ? 'bg-red-50 border border-red-200'
                : 'bg-green-50 border border-green-200'
              }`}>
              <p className={
                status.includes('Invalid') || status.includes('error') || status.includes('exists')
                  ? 'text-red-700 text-sm'
                  : 'text-green-700 text-sm'
              }>{status}</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Demo credentials:<br />
              Student: john123/pass123<br />
              Admin: admin/admin123
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                {currentUser.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {currentUser.name}</span>
              {currentUser.role === 'student' && (
                <button
                  onClick={() => setShowCamera(!showCamera)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Mark Attendance
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 transition-colors flex items-center"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === 'admin' ? (
          // Admin Dashboard
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <UserPlus className="w-6 h-6 mr-2" />
                Student Registration
              </h2>

              {!showRegistration ? (
                <button
                  onClick={() => {
                    setShowRegistration(true);
                    setStatus('Fill in the student details below');
                  }}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  New Student Registration
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Student Name"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Roll Number"
                      value={registerForm.roll}
                      onChange={(e) => setRegisterForm({ ...registerForm, roll: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={registerForm.dept}
                      onChange={(e) => setRegisterForm({ ...registerForm, dept: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="EEE">EEE</option>
                      <option value="ECE">ECE</option>
                      <option value="MECH">MECH</option>
                    </select>
                    <div></div>
                    <input
                      type="text"
                      placeholder="Username"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {showCamera && (
                    <div className="mt-4">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: 'user' }}
                        className="w-full max-w-md mx-auto rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      onClick={handleRegistration}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {showCamera ? 'Capture Face' : 'Start Registration'}
                    </button>
                    <button
                      onClick={() => {
                        setShowRegistration(false);
                        setShowCamera(false);
                        setRegisterForm({ name: '', roll: '', dept: 'CSE', username: '', password: '' });
                        setStatus('Ready');
                      }}
                      className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {status !== 'Ready' && (
                <div className={`mt-4 p-3 rounded-lg ${status.includes('error') || status.includes('Invalid') || status.includes('exists')
                    ? 'bg-red-50 border border-red-200'
                    : status.includes('Successfully') || status.includes('Processing')
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                  <p className={
                    status.includes('error') || status.includes('Invalid') || status.includes('exists')
                      ? 'text-red-700'
                      : status.includes('Successfully') || status.includes('Processing')
                        ? 'text-green-700'
                        : 'text-blue-700'
                  }>{status}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Users className="w-6 h-6 mr-2" />
                Student Management
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockStudents.map(student => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.roll}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.dept}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          // Student Dashboard
          <div className="space-y-8">
            {/* Attendance Camera */}
            {showCamera && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Mark Your Attendance</h2>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <select
                    value={semester}
                    onChange={(e) => setSemester(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Semester 1</option>
                    <option value={2}>Semester 2</option>
                  </select>

                  {semester === 1 ? (
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="maths">Maths</option>
                      <option value="physics">Physics</option>
                      <option value="chemistry">Chemistry</option>
                      <option value="c programming">C Programming</option>
                      <option value="os">OS</option>
                    </select>
                  ) : (
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dbms">DBMS</option>
                      <option value="web">Web</option>
                      <option value="oops">OOPs</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                    </select>
                  )}

                  <button
                    onClick={() => setShowCamera(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close Camera
                  </button>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'user' }}
                    className="w-full max-w-md rounded-lg"
                  />

                  <button
                    onClick={handleAttendanceCapture}
                    disabled={blinkInProgress}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {blinkInProgress ? 'Detecting Blink...' : 'Mark Attendance'}
                  </button>

                  {status && status !== 'Ready' && (
                    <div
                      className={`p-3 rounded-lg ${
                        status.includes('error') || status.includes('failed')
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <p className={status.includes('error') || status.includes('failed') ? 'text-red-700' : 'text-blue-700'}>
                        {status}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attendance Calendar */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Calendar className="w-6 h-6 mr-2" />
                  Attendance Calendar
                </h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateCalendar().map((item, index) => (
                  <div
                    key={index}
                    className={`aspect-square flex items-center justify-center relative border rounded-lg ${item === null ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                      }`}
                  >
                    {item && (
                      <>
                        <span className="text-sm font-medium text-gray-700">{item.day}</span>
                        {item.attendance && (
                          <div className="absolute top-1 right-1">
                            {item.attendance.present ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span>Present</span>
                </div>
                <div className="flex items-center">
                  <XCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span>Absent</span>
                </div>
              </div>
            </div>

            {/* Student Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{currentUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                  <p className="text-gray-900">{currentUser.roll}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <p className="text-gray-900">{currentUser.dept}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <p className="text-gray-900">{currentUser.username}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceDashboard;
