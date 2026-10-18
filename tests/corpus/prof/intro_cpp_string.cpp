#include <iostream>
using namespace std;
int main() {
    string hello = "Hello" ;
    string world = "world!" ;
    string msg = hello + " " + world ;
    cout <<  msg << endl ;
    msg[0] = 'h';
    cout <<  msg << endl ;
    cout << msg.size() << endl ;
    cout << msg.at(0) << endl ;
    string *hello_ptr = &hello;
    string &hello_ref = hello;
    hello_ref += "!!";
    cout << hello << " " << *hello_ptr << " " << hello_ref << endl;
    double x = 1.0 ;
    int y = (int) x ;
    float z = (float) (x / 3) ;
    cout << y << " " << z << " " << static_cast<int>(7.9) << endl;
    return 0;
}
