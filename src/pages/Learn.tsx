import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useState } from "react";
import {
  BookOpen,
  Play,
  ExternalLink,
  Star,
  Clock,
  Users,
  TrendingUp,
  PiggyBank,
  Calculator,
  Target,
  Award,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Learn() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("courses");
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const { language } = usePreferences();
  const isEnglish = language === 'en';

  const handleFeatureNotReady = (featureName: string) => {
    toast({
      title: "Feature coming soon",
      description: `${featureName} is currently under development.`,
    });
  };

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

  const tips = [
    {
      category: "Daily Management",
      categoryHindi: "दैनिक प्रबंधन",
      tips: [
        {
          title: "Record Every Transaction",
          titleHindi: "हर लेन-देन दर्ज करें",
          content: "Use voice commands to quickly record all income and expenses. This ensures accuracy and saves time.",
          contentHindi: "सभी आय और व्यय को तुरंत रिकॉर्ड करने के लिए वॉयस कमांड का उपयोग करें।"
        },
        {
          title: "Check Daily Summary",
          titleHindi: "दैनिक सारांश देखें",
          content: "Review your daily profit/loss before closing. Identify patterns and opportunities.",
          contentHindi: "दुकान बंद करने से पहले दैनिक लाभ-हानि की समीक्षा करें।"
        }
      ]
    },
    {
      category: "Growth Strategy",
      categoryHindi: "विकास रणनीति",
      tips: [
        {
          title: "Track Peak Hours",
          titleHindi: "व्यस्त समय को ट्रैक करें",
          content: "Use analytics to identify your busiest sales hours and optimize inventory accordingly.",
          contentHindi: "अपने सबसे व्यस्त बिक्री घंटों की पहचान करें और उसी अनुसार इन्वेंट्री को अनुकूलित करें।"
        },
        {
          title: "Focus on High-Margin Items",
          titleHindi: "उच्च मार्जिन वाली वस्तुओं पर ध्यान दें",
          content: "Promote products that give you better profit margins while maintaining customer satisfaction.",
          contentHindi: "ग्राहकों की संतुष्टि बनाए रखते हुए बेहतर लाभ मार्जिन देने वाले उत्पादों को बढ़ावा दें।"
        }
      ]
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

  const achievements = [
    { name: "First Week Complete", icon: CheckCircle, earned: true },
    { name: "Voice Expert", icon: Award, earned: true },
    { name: "Analytics Pro", icon: TrendingUp, earned: false },
    { name: "Profit Master", icon: Target, earned: false }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learning Center</h1>
          <p className="text-muted-foreground">
            {!isEnglish && "शिक्षा केंद्र - "}Improve your business skills with our courses and tips
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowProgress(true)}>
            <Star className="mr-2 h-4 w-4" />
            My Progress
          </Button>
        </div>
      </div>

      {/* Achievement Badges */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-warning" />
            Your Achievements
          </CardTitle>
          <CardDescription>Track your learning progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-center border-2 transition-all ${achievement.earned
                  ? 'bg-success/10 border-success/20 text-success'
                  : 'bg-muted/50 border-muted text-muted-foreground'
                  }`}
              >
                <achievement.icon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">{achievement.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="tips">Daily Tips</TabsTrigger>
          <TabsTrigger value="videos">Video Tutorials</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className={`shadow-card border-2 ${course.color}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-1">{course.title}</CardTitle>
                      {!isEnglish && <p className="text-sm text-muted-foreground mb-2">{course.titleHindi}</p>}
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

        <TabsContent value="tips" className="space-y-6">
          {tips.map((tipCategory, index) => (
            <Card key={index} className="shadow-card">
              <CardHeader>
                <CardTitle>{tipCategory.category}</CardTitle>
                {!isEnglish && <CardDescription className="text-base">{tipCategory.categoryHindi}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                {tipCategory.tips.map((tip, tipIndex) => (
                  <div key={tipIndex} className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-1">{tip.title}</h4>
                    {!isEnglish && <p className="text-sm text-muted-foreground mb-2">{tip.titleHindi}</p>}
                    <p className="text-sm mb-1">{tip.content}</p>
                    {!isEnglish && <p className="text-sm text-muted-foreground italic">{tip.contentHindi}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
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
                    <h3 className="font-medium mb-1 line-clamp-2">{video.title}</h3>
                    {!isEnglish && <p className="text-sm text-muted-foreground mb-2">{video.titleHindi}</p>}

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

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Business Calculators
                </CardTitle>
                <CardDescription>Financial tools to help your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => handleFeatureNotReady('Profit Margin Calculator')}>
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Profit Margin Calculator
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleFeatureNotReady('Break-even Analysis')}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Break-even Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleFeatureNotReady('ROI Calculator')}>
                  <Target className="mr-2 h-4 w-4" />
                  ROI Calculator
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  External Resources
                </CardTitle>
                <CardDescription>Helpful links and references</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between" onClick={() => handleFeatureNotReady('Government Schemes Directory')}>
                  Government Schemes for SMEs
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={() => handleFeatureNotReady('GST Registration Guide')}>
                  GST Registration Guide
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between" onClick={() => handleFeatureNotReady('Digital India Resources')}>
                  Digital India Resources
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Study Plan */}
      <Card className="shadow-card bg-gradient-card">
        <CardHeader>
          <CardTitle>💡 Your Weekly Study Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">This Week's Focus</h4>
              <p className="text-sm text-muted-foreground">
                Complete "Small Business Financial Management" course and practice voice commands daily.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Next Week's Goal</h4>
              <p className="text-sm text-muted-foreground">
                Master profit calculation methods and start GST planning course.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Progress Modal */}
      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              My Learning Progress
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <p className="text-muted-foreground mb-4">
                You're doing great! You have learned how to use voice commands to record transactions 
                and are making good progress on basic profit calculation methods.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Small Business Financial Management</h4>
                  <span className="text-sm text-success font-medium">100%</span>
                </div>
                <Progress value={100} className="h-2 bg-muted" />
                <p className="text-xs text-muted-foreground mt-2">
                  Completed! You earned the "Voice Expert" and "First Week Complete" badges.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Digital Growth for Retailers</h4>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <Progress value={45} className="h-2 bg-muted" />
                <p className="text-xs text-muted-foreground mt-2">
                  In progress (2h 15m remaining). Keep it up!
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}