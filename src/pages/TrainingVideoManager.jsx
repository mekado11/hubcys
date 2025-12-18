import React, { useState, useEffect } from "react";
import { TrainingVideo } from "@/entities/TrainingVideo";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  Video, 
  Trash2, 
  Edit, 
  Play, 
  Users, 
  Code, 
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  Eye
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function TrainingVideoManager() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    module_id: '',
    video_title: '',
    video_description: '',
    target_audience: 'general',
    video_order: 1,
    video_transcript: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Available training modules (matching the ones in SecurityTraining.js)
  const trainingModules = [
    // General modules
    { id: 'phishing-awareness', name: 'Phishing Awareness', audience: 'general' },
    { id: 'password-security', name: 'Password Security', audience: 'general' },
    { id: 'social-engineering', name: 'Social Engineering Awareness', audience: 'general' },
    { id: 'data-handling', name: 'Data Handling & Classification', audience: 'general' },
    { id: 'remote-work-security', name: 'Remote Work Security', audience: 'general' },
    { id: 'incident-reporting', name: 'Incident Reporting', audience: 'general' },
    { id: 'physical-security', name: 'Physical Security', audience: 'general' },
    { id: 'business-email-compromise', name: 'Business Email Compromise', audience: 'general' },
    
    // Engineering modules
    { id: 'secure-coding-owasp', name: 'Secure Coding & OWASP Top 10', audience: 'engineering' },
    { id: 'api-security', name: 'API Security Best Practices', audience: 'engineering' },
    { id: 'container-security', name: 'Container Security', audience: 'engineering' },
    { id: 'cloud-security', name: 'Cloud Security Fundamentals', audience: 'engineering' },
    { id: 'iac-security', name: 'Infrastructure as Code Security', audience: 'engineering' },
    { id: 'cicd-security', name: 'CI/CD Pipeline Security', audience: 'engineering' },
    { id: 'secrets-management', name: 'Secrets Management', audience: 'engineering' },
    { id: 'vulnerability-management', name: 'Vulnerability Management', audience: 'engineering' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Only admins can access this page
      if (currentUser.company_role !== 'admin') {
        window.location.href = '/SecurityTraining';
        return;
      }

      await loadVideos();
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      const videoList = await TrainingVideo.filter({ company_id: user?.company_id }, '-created_date');
      setVideos(videoList);
    } catch (error) {
      console.error("Error loading videos:", error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid video file (MP4, WebM, or OGG)');
        return;
      }

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        alert('File size must be less than 500MB');
        return;
      }

      setSelectedFile(file);
      
      // Auto-populate title from filename
      if (!uploadForm.video_title) {
        const filename = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setUploadForm(prev => ({ ...prev, video_title: filename }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.module_id || !uploadForm.video_title) {
      alert('Please fill in all required fields and select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload video file
      const { file_url } = await UploadFile({ file: selectedFile });

      // Create video record
      await TrainingVideo.create({
        company_id: user.company_id,
        module_id: uploadForm.module_id,
        video_title: uploadForm.video_title,
        video_description: uploadForm.video_description,
        video_url: file_url,
        target_audience: uploadForm.target_audience,
        video_order: uploadForm.video_order,
        video_transcript: uploadForm.video_transcript,
        created_by_email: user.email
      });

      // Reset form and reload
      setUploadForm({
        module_id: '',
        video_title: '',
        video_description: '',
        target_audience: 'general',
        video_order: 1,
        video_transcript: ''
      });
      setSelectedFile(null);
      setShowUploadDialog(false);
      
      await loadVideos();
      alert('Video uploaded successfully!');

    } catch (error) {
      console.error("Error uploading video:", error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video? This cannot be undone.')) {
      return;
    }

    try {
      await TrainingVideo.delete(videoId);
      await loadVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
      alert('Failed to delete video.');
    }
  };

  const getModuleName = (moduleId) => {
    const module = trainingModules.find(m => m.id === moduleId);
    return module ? module.name : moduleId;
  };

  const getAudienceIcon = (audience) => {
    switch (audience) {
      case 'engineering': return <Code className="w-4 h-4" />;
      case 'general': return <Users className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getAudienceColor = (audience) => {
    switch (audience) {
      case 'engineering': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'general': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white text-lg">Loading Video Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold cyber-text-glow mb-2">Training Video Manager</h1>
            <p className="text-gray-400">Upload and manage training videos for your security education program</p>
          </div>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Video
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-effect border-cyan-500/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Video className="w-8 h-8 text-cyan-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">{videos.length}</p>
                  <p className="text-gray-400 text-sm">Total Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Code className="w-8 h-8 text-purple-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {videos.filter(v => v.target_audience === 'engineering').length}
                  </p>
                  <p className="text-gray-400 text-sm">Engineering Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-400 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {videos.filter(v => v.target_audience === 'general').length}
                  </p>
                  <p className="text-gray-400 text-sm">General User Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Videos List */}
        {videos.length === 0 ? (
          <Card className="glass-effect border-cyan-500/20">
            <CardContent className="p-12 text-center">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Training Videos Yet</h3>
              <p className="text-gray-400 mb-6">
                Start building your video training library by uploading your first training video.
              </p>
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload First Video
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="glass-effect border-slate-700/50 hover:border-cyan-500/40 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getAudienceColor(video.target_audience)}>
                          {getAudienceIcon(video.target_audience)}
                          <span className="ml-1 capitalize">{video.target_audience}</span>
                        </Badge>
                        <Badge variant="outline" className="text-gray-400 border-gray-600">
                          Order {video.video_order}
                        </Badge>
                      </div>
                      <CardTitle className="text-white text-lg">{video.video_title}</CardTitle>
                      <p className="text-gray-400 text-sm mt-1">
                        Module: {getModuleName(video.module_id)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white"
                        onClick={() => setEditingVideo(video)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeleteVideo(video.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {video.video_description && (
                    <p className="text-gray-400 text-sm mb-4">{video.video_description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {video.video_duration_seconds && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{Math.round(video.video_duration_seconds / 60)} min</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Active</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                      onClick={() => window.open(video.video_url, '_blank')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Preview Video
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center text-cyan-300">
                <Upload className="w-5 h-5 mr-2" />
                Upload Training Video
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <Label htmlFor="video-file" className="text-gray-300 mb-2 block">
                  Video File *
                </Label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <input
                    id="video-file"
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="video-file" className="cursor-pointer">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <p className="text-white font-medium">{selectedFile.name}</p>
                        <p className="text-gray-400 text-sm">
                          {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white">Click to select video file</p>
                        <p className="text-gray-400 text-sm">MP4, WebM, or OGG • Max 500MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Module Selection */}
              <div>
                <Label className="text-gray-300 mb-2 block">Training Module *</Label>
                <Select 
                  value={uploadForm.module_id} 
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, module_id: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-gray-600">
                    <SelectValue placeholder="Select training module" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-600">
                    <optgroup label="General User Training">
                      {trainingModules.filter(m => m.audience === 'general').map(module => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </optgroup>
                    <optgroup label="Engineering Training">
                      {trainingModules.filter(m => m.audience === 'engineering').map(module => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </optgroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Video Title */}
              <div>
                <Label className="text-gray-300 mb-2 block">Video Title *</Label>
                <Input
                  value={uploadForm.video_title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, video_title: e.target.value }))}
                  placeholder="Enter video title"
                  className="bg-slate-800 border-gray-600"
                />
              </div>

              {/* Video Description */}
              <div>
                <Label className="text-gray-300 mb-2 block">Description</Label>
                <Textarea
                  value={uploadForm.video_description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, video_description: e.target.value }))}
                  placeholder="Brief description of what this video covers"
                  className="bg-slate-800 border-gray-600"
                  rows={3}
                />
              </div>

              {/* Target Audience */}
              <div>
                <Label className="text-gray-300 mb-2 block">Target Audience</Label>
                <Select 
                  value={uploadForm.target_audience} 
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, target_audience: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-gray-600">
                    <SelectItem value="general">General Users</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="all">All Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Video Order */}
              <div>
                <Label className="text-gray-300 mb-2 block">Order in Module</Label>
                <Input
                  type="number"
                  min="1"
                  value={uploadForm.video_order}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, video_order: parseInt(e.target.value) || 1 }))}
                  className="bg-slate-800 border-gray-600"
                />
              </div>

              {/* Transcript */}
              <div>
                <Label className="text-gray-300 mb-2 block">Video Transcript (for accessibility)</Label>
                <Textarea
                  value={uploadForm.video_transcript}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, video_transcript: e.target.value }))}
                  placeholder="Paste the full transcript of the video here"
                  className="bg-slate-800 border-gray-600"
                  rows={6}
                />
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">Uploading...</span>
                    <span className="text-cyan-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                  disabled={uploading}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile || !uploadForm.module_id || !uploadForm.video_title}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}