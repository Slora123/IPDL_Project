import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useI18n } from "@/contexts/I18nContext";
import { useState } from "react";
import {
  BookOpen,
  Play,
  Star,
  Clock,
  Users,
  GraduationCap,
  Video,
} from "lucide-react";

export default function Learn() {
  const [activeTab, setActiveTab] = useState("courses");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const { language } = usePreferences();
  const { t } = useI18n();
  const isEnglish = language === 'en';

  const courses = [
    {
      id: "finance-101",
      title: "Small Business Financial Management",
      titleHindi: "लघु व्यवसाय वित्तीय प्रबंधन",
      description: "Master the basics of cash flow, profit & loss, and basic bookkeeping for your kirana or retail shop.",
      level: "Beginner",
      duration: "2h 30m",
      lessons: 8,
      rating: 4.8,
      language: "Hindi/English",
      category: "Finance",
      color: "border-primary/20 bg-primary/5",
      videoId: "Fds7ypAXMFc" // Valid video
    },
    {
      id: "digital-growth",
      title: "Digital Growth for Retailers",
      titleHindi: "खुदरा विक्रेताओं के लिए डिजिटल विकास",
      description: "Learn how to use digital tools and social media to attract more customers to your brick-and-mortar store.",
      level: "Intermediate",
      duration: "3h 45m",
      lessons: 12,
      rating: 4.9,
      language: "Hindi/Marathi",
      category: "Marketing",
      color: "border-success/20 bg-success/5",
      videoId: "YhK_PGhdPe8"
    }
  ];

  const videos = [
    {
      title: "Finance For Beginners",
      titleHindi: "शुरुआती लोगों के लिए वित्त",
      videoId: "Fds7ypAXMFc",
      duration: "8:32",
      views: "2.1K",
      category: "Tutorial"
    },
    {
      title: "Reading Your Financial Dashboard",
      titleHindi: "अपना वित्तीय डैशबोर्ड पढ़ना",
      videoId: "YhK_PGhdPe8",
      duration: "12:15",
      views: "1.8K",
      category: "Analytics"
    },
    {
      title: "Small Business Accounting",
      titleHindi: "लघु व्यवसाय लेखांकन",
      videoId: "pKpdibyljR4",
      duration: "6:45",
      views: "3.2K",
      category: "Setup"
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('title', 'learn', 'Financial Knowledge')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle', 'learn', 'Master financial management with video courses and tutorials')}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-auto gap-2 p-1">
          <TabsTrigger value="courses" className="flex items-center gap-2 py-2">
            <GraduationCap className="h-4 w-4" />
            {t('courses', 'learn', 'Courses')}
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2 py-2">
            <Video className="h-4 w-4" />
            {t('tutorials', 'learn', 'Tutorials')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className={`shadow-card border-2 ${course.color}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-1">{isEnglish ? course.title : course.titleHindi}</CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">{course.level}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.lessons} lessons
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-current text-yellow-500" />
                        {course.rating}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="outline" className="mr-2">{course.language}</Badge>
                        <Badge variant="outline">{course.category}</Badge>
                      </div>
                      <Button size="sm" className="bg-gradient-success" onClick={() => setPlayingVideoId(course.videoId)}>
                        <Play className="mr-2 h-4 w-4" />
                        Start Course
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video, index) => (
              <Card key={index} className="shadow-card hover:shadow-lg transition-shadow overflow-hidden group">
                <CardContent className="p-0">
                  <div className="aspect-video w-full bg-muted">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${video.videoId}`} 
                      title={video.title}
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium mb-1 line-clamp-2">{isEnglish ? video.title : video.titleHindi}</h3>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{video.duration}</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {video.views}
                      </div>
                    </div>

                    <Badge variant="outline" className="mt-2">{video.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Video Player Modal */}
      <Dialog open={!!playingVideoId} onOpenChange={(open) => !open && setPlayingVideoId(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black border-none">
          <div className="aspect-video w-full">
            {playingVideoId && (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`}
                title="Course Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}