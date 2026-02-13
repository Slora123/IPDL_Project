import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function Learn() {
  const courses = [
    {
      id: 1,
      title: "Small Business Financial Management",
      titleHindi: "छोटे व्यापार की वित्तीय प्रबंधन",
      description: "Master the basics of managing finances for your small business",
      level: "Beginner",
      duration: "45 mins",
      lessons: 8,
      rating: 4.8,
      language: "Hindi + English",
      category: "Finance Basics",
      color: "bg-success/10 text-success border-success/20"
    },
    {
      id: 2,
      title: "Profit & Loss Understanding",
      titleHindi: "लाभ-हानि की समझ",
      description: "Learn how to calculate and improve your business profitability",
      level: "Intermediate", 
      duration: "30 mins",
      lessons: 5,
      rating: 4.9,
      language: "Marathi + Hindi",
      category: "Analytics",
      color: "bg-primary/10 text-primary border-primary/20"
    },
    {
      id: 3,
      title: "GST & Tax Planning",
      titleHindi: "जीएसटी और कर नियोजन",
      description: "Navigate GST requirements and optimize your tax planning",
      level: "Advanced",
      duration: "60 mins", 
      lessons: 12,
      rating: 4.7,
      language: "English + Hindi",
      category: "Legal & Tax",
      color: "bg-warning/10 text-warning border-warning/20"
    },
    {
      id: 4,
      title: "Digital Payment Solutions",
      titleHindi: "डिजिटल भुगतान समाधान",
      description: "Understand and implement digital payment systems",
      level: "Beginner",
      duration: "25 mins",
      lessons: 4,
      rating: 4.6,
      language: "Hindi",
      category: "Technology",
      color: "bg-info/10 text-info border-info/20"
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
      title: "How to Use Voice Commands Effectively",
      titleHindi: "वॉयस कमांड का प्रभावी उपयोग कैसे करें",
      duration: "8:32",
      views: "2.1K",
      category: "Tutorial"
    },
    {
      title: "Reading Your Financial Dashboard",
      titleHindi: "अपना वित्तीय डैशबोर्ड पढ़ना",
      duration: "12:15", 
      views: "1.8K",
      category: "Analytics"
    },
    {
      title: "Setting Up Categories for Your Business",
      titleHindi: "अपने व्यापार के लिए श्रेणियां सेट करना",
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
            शिक्षा केंद्र - Improve your business skills with our courses and tips
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Star className="mr-2 h-4 w-4" />
            My Progress
          </Button>
          <Button size="sm" className="bg-gradient-primary">
            <BookOpen className="mr-2 h-4 w-4" />
            Browse All
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
                className={`p-3 rounded-lg text-center border-2 transition-all ${
                  achievement.earned 
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

      <Tabs defaultValue="courses" className="space-y-4">
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
                      <p className="text-sm text-muted-foreground mb-2">{course.titleHindi}</p>
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
                      <Button size="sm" className="bg-gradient-success">
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
                <CardDescription className="text-base">{tipCategory.categoryHindi}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tipCategory.tips.map((tip, tipIndex) => (
                  <div key={tipIndex} className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-1">{tip.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{tip.titleHindi}</p>
                    <p className="text-sm mb-1">{tip.content}</p>
                    <p className="text-sm text-muted-foreground italic">{tip.contentHindi}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video, index) => (
              <Card key={index} className="shadow-card hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <Play className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  <h3 className="font-medium mb-1 line-clamp-2">{video.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{video.titleHindi}</p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{video.duration}</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {video.views}
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="mt-2">{video.category}</Badge>
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
                <Button variant="outline" className="w-full justify-start">
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Profit Margin Calculator
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Break-even Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start">
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
                <Button variant="outline" className="w-full justify-between">
                  Government Schemes for SMEs
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  GST Registration Guide  
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
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
    </div>
  );
}